const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🚀 สร้างโฟลเดอร์เก็บไฟล์อัตโนมัติ
const uploadDir = 'uploads/approved_docs/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1. API ส่งฟอร์ม Request
router.post('/projects', upload.single('approvedDocument'), async (req, res) => {
  try {
    const requestData = JSON.parse(req.body.requestData);
    const { name, site, category, description, requester_id, form_data, status } = requestData;
    const document_path = req.file ? req.file.path : null; 
    const reqId = `REQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;

    await pool.query('BEGIN');
    const insertQuery = `
      INSERT INTO projects (id, name, site, category, description, requester_id, status, form_data, document_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
    `;
    const finalStatus = status || 'Pending Approval';
    const projectResult = await pool.query(insertQuery, [
      reqId, name, site, category, description, requester_id, finalStatus, form_data, document_path
    ]);
    await pool.query('COMMIT');
    res.status(201).json({ success: true, data: projectResult.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. API ดึงงานรออนุมัติ (Manager Dashboard)
router.get('/projects/pending', async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.name, p.site, p.category, p.description, p.created_at, p.form_data, p.document_path, u.username AS requester_name
      FROM projects p LEFT JOIN users u ON p.requester_id = u.id
      WHERE p.status = 'Pending Approval' ORDER BY p.created_at DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. API ดึงงานทั้งหมด (Project Portfolio)
router.get('/projects/all', async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.username AS requester_name FROM projects p
      LEFT JOIN users u ON p.requester_id = u.id ORDER BY p.created_at DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. API อนุมัติงาน (Manager อนุมัติ)
router.put('/projects/:id/approve', async (req, res) => {
  const projectId = req.params.id;
  const { manager_id, assignee, phase, startDate, endDate, manDay, remark, form_data } = req.body;
  try {
    await pool.query('BEGIN');
    const updatedFormData = {
      ...(form_data || {}),
      compliance: { ...(form_data?.compliance || {}), baStartDate: startDate, baEndDate: endDate, manDay: manDay },
      approval_remark: remark,
      assigned_to: assignee
    };
    const updateQuery = `
      UPDATE projects SET status = 'Initiate', phase = $1, manager_id = $2, form_data = $3, updated_at = NOW()
      WHERE id = $4;
    `;
    await pool.query(updateQuery, [phase, parseInt(manager_id) || null, updatedFormData, projectId]);
    await pool.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 5. API อัปเดตความคืบหน้า (พนักงานอัปเดต) -> รองรับการแนบไฟล์หลักฐาน
router.put('/projects/update/:id', upload.single('progressFile'), async (req, res) => {
  const projectId = req.params.id;
  
  // 🚀 แกะข้อมูลที่ส่งมา (ถ้ามีไฟล์แนบมา ข้อมูลจะถูกห่อเป็น String ต้องแปลงกลับเป็น Object)
  let projectData = req.body;
  if (req.body.projectData) {
    try { projectData = JSON.parse(req.body.projectData); } 
    catch (e) { projectData = req.body; }
  }

  const { status, phase, form_data } = projectData;

  try {
    await pool.query('BEGIN');
    
    let updatedFormData = form_data || {};
    
    // 🚀 ถ้าระบบเจอว่ามีการแนบไฟล์หลักฐานมาด้วย ให้เซฟที่อยู่ไฟล์ลงใน database
    if (req.file) {
      updatedFormData = {
        ...updatedFormData,
        tracking: {
          ...(updatedFormData.tracking || {}),
          progressFile: req.file.path // บันทึกที่อยู่ไฟล์
        }
      };
    }

    const updateQuery = `
      UPDATE projects SET status = $1, phase = $2, form_data = $3, updated_at = NOW()
      WHERE id = $4 RETURNING *;
    `;
    const result = await pool.query(updateQuery, [status, phase, updatedFormData, projectId]);
    await pool.query('COMMIT');
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error updating project:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;