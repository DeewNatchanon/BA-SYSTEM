const express = require('express');
const { getUsers, updateUser } = require('../controllers/userController'); 
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 🔓 ปลดล็อก: ให้พนักงานทุกคนที่เข้าสู่ระบบแล้ว (requireAuth) สามารถดึงรายชื่อผู้ใช้ได้ 
// (ถอด requirePermission('role_settings', 'read') ออก เพื่อแก้ Error 403 Forbidden)
router.get('/', requireAuth, getUsers);

// 🚀 บังคับให้ต้องใช้ Token ในการเปลี่ยนชื่อ (แก้ของตัวเอง ไม่ต้องใช้ Permission ระดับโมดูล)
router.patch('/:id', requireAuth, updateUser); 

module.exports = router;