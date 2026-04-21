const express = require('express');
const multer = require('multer');
const fs = require('fs');

// ดึง submitForm ที่เราเพิ่งสร้างมาใช้งานด้วย
const { getPermissions, submitForm } = require('../controllers/formController');
const { requireAuth } = require('../middleware/auth'); 

const router = express.Router();

// ==========================================
// 1. ตั้งค่าระบบจัดการไฟล์ (Multer Configuration)
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/approved_docs';
    // สร้างโฟลเดอร์ให้เองถ้าระบบยังไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // ป้องกันชื่อไฟล์ซ้ำกันด้วยการใส่วันที่และเวลาลงไปข้างหน้า
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // จำกัดขนาดไฟล์สูงสุด 10MB
});

// ==========================================
// 2. จัดการ Routes
// ==========================================

// Route เดิมของคุณ
router.get('/permissions', requireAuth, getPermissions);

// 🚀 Route ใหม่สำหรับรับข้อมูล Submit พร้อมไฟล์แนบ
// ใช้ upload.single('approvedDocument') ให้ชื่อตรงกับหน้า React
router.post('/submit', requireAuth, upload.single('approvedDocument'), submitForm);

module.exports = router;