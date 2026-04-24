const express = require('express');
// 🚀 เพิ่ม changePassword เข้ามา
const { register, login, me, changePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

// 🚀 เปิดเส้นทางเปลี่ยนรหัสผ่าน
router.post('/change-password', requireAuth, changePassword);

module.exports = router;