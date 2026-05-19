const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requirePermission } = require('../middleware/auth');

const uploadDir = "uploads/approved_docs/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้! อนุญาตเฉพาะ PDF และรูปภาพเท่านั้น'), false);
    }
  }
});

// ====================================================
// 🚀 API: สร้างโครงการใหม่
// ====================================================
router.post("/projects", requireAuth, upload.single("approvedDocument"), async (req, res) => {
    try {
      const requestData = JSON.parse(req.body.requestData);
      const { name, site, category, description, requester_id, form_data, status, phase } = requestData;
      const document_path = req.file ? req.file.path.replace(/\\/g, "/") : null;
      const reqId = `REQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 1000)}`;
      
      const finalStatus = status || "Pending Approval";
      const finalPhase = phase || "Requirement"; 

      let safeFormData = form_data || {};
      safeFormData.phase = finalPhase;

      await pool.query("BEGIN");
      
      const insertQuery = `
        INSERT INTO projects (id, name, site, category, description, requester_id, status, phase, form_data, document_path) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10) RETURNING *;
      `;
      const projectResult = await pool.query(insertQuery, [
        reqId, name, site, category, description, requester_id, finalStatus, finalPhase, JSON.stringify(safeFormData), document_path
      ]);

      await pool.query("COMMIT");
      res.status(201).json(projectResult.rows[0]);
    } catch (error) {
      await pool.query("ROLLBACK");
      res.status(500).json({ error: error.message });
    }
  }
);

// ====================================================
// 🚀 API: ดึงรายชื่อโครงการทั้งหมด
// ====================================================
router.get("/projects/all", requireAuth, async (req, res) => {
  try {
    const query = `SELECT p.*, u.username AS requester_name FROM projects p LEFT JOIN users u ON p.requester_id = u.id ORDER BY p.updated_at DESC;`;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================================
// 🚀 API: ดึงรายชื่อโครงการที่รออนุมัติ
// ====================================================
router.get("/projects/pending", requireAuth, async (req, res) => {
  try {
    const query = `SELECT p.*, u.username AS requester_name FROM projects p LEFT JOIN users u ON p.requester_id = u.id WHERE p.status = 'Pending Approval' OR p.form_data::text LIKE '%"isPendingApproval":true%' OR p.form_data::text LIKE '%"isPendingApproval": true%' ORDER BY p.created_at DESC;`;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================================
// 🚀 API: ดึงรายชื่อโครงการเดี่ยว
// ====================================================
router.get("/projects/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE id::text = $1 OR (form_data->>'requestId') = $1;", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "ไม่พบโครงการนี้" });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================================
// 🛠️ API: อัปเดตสถานะและข้อมูล
// ====================================================
router.put("/projects/update/:id", requireAuth, upload.single("progressFile"), async (req, res) => {
    const projectId = req.params.id;
    let projectData = req.body;
    
    // ถ้าส่งมาเป็น FormData จะมี req.body.projectData
    if (req.body.projectData) {
      try { projectData = JSON.parse(req.body.projectData); } catch (e) { projectData = req.body; }
    }

    const { status, phase, form_data, timeline } = projectData;

    // 🌟 ดักจับ Error หากข้อมูลมาไม่ถึง (ป้องกัน Error 500)
    if (!status || !form_data) {
        return res.status(400).json({ error: "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง หรือขาดฟิลด์สำคัญ (status, form_data)" });
    }

    try {
      await pool.query("BEGIN");

      let updatedFormData = form_data;
      if (typeof updatedFormData === "string") {
        try { updatedFormData = JSON.parse(updatedFormData); } catch (e) { updatedFormData = {}; }
      }
      updatedFormData = updatedFormData || {};

      if (req.file) {
        updatedFormData.tracking = {
          ...(updatedFormData.tracking || {}),
          progressFile: req.file.path.replace(/\\/g, "/")
        };
      }

      let parsedTimeline = timeline;
      if (typeof timeline === "string") {
        try { parsedTimeline = JSON.parse(timeline); } catch(e) { parsedTimeline = {}; }
      }
      
      // สำคัญ: จับ timeline ยัดเข้าไปใน form_data ให้หมด
      updatedFormData.timeline = parsedTimeline || updatedFormData.timeline;

      const updateQuery = `
        UPDATE projects 
        SET status = $1, phase = $2, form_data = $3::jsonb, updated_at = NOW() 
        WHERE id::text = $4 OR (form_data->>'requestId') = $4 
        RETURNING *;
      `;
      
      const result = await pool.query(updateQuery, [
        status, 
        phase || "Requirement", 
        JSON.stringify(updatedFormData), 
        projectId
      ]);

      if (result.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ error: "ไม่พบโครงการที่ต้องการอัปเดต" });
      }

      await pool.query("COMMIT");
      res.status(200).json(result.rows[0]);
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error updating project:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ====================================================
// ❌ API: ลบโครงการออกจากระบบ
// ====================================================
router.delete("/projects/delete/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("BEGIN");
    const result = await pool.query("DELETE FROM projects WHERE id::text = $1 OR (form_data->>'requestId') = $1 RETURNING *;", [req.params.id]);
    if (result.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "ไม่พบโครงการที่ต้องการลบ" });
    }
    await pool.query("COMMIT");
    res.status(200).json({ message: "ลบโครงการออกจากระบบเรียบร้อยแล้ว" });
  } catch (error) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;