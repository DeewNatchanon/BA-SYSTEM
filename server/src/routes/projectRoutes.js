const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// เส้นทางสำหรับดึงข้อมูล และ อัปเดตข้อมูล
router.get('/all', projectController.getAllProjects);
router.put('/update/:id', projectController.updateProject);

module.exports = router;