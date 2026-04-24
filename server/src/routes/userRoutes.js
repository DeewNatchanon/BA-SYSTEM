const express = require('express');
const { getUsers, updateUser } = require('../controllers/userController'); 
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('manager'), getUsers);
// 🚀 บังคับให้ต้องใช้ Token ในการเปลี่ยนชื่อ
router.patch('/:id', requireAuth, updateUser); 

module.exports = router;