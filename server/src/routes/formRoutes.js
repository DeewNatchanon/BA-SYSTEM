const express = require('express');
const multer = require('multer');
const fs = require('fs');

const { getPermissions, submitForm } = require('../controllers/formController');
// 🌟 นำเข้า requirePermission
const { requireAuth, requirePermission } = require('../middleware/auth'); 

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/approved_docs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
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

// 🔒 ดักสิทธิ์การดึงข้อมูล Form Permission
router.get('/permissions', requireAuth, requirePermission('request_form', 'read'), getPermissions);

// 🔒 ดักสิทธิ์การ Submit Form (ต้องมีสิทธิ์ Create)
router.post('/submit', requireAuth, requirePermission('request_form', 'create'), upload.single('approvedDocument'), submitForm);

module.exports = router;