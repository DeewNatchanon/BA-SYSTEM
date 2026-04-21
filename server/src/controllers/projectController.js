const pool = require('../config/db'); // 🚨 ตรวจสอบชื่อไฟล์เชื่อมต่อ DB ของคุณด้วยนะครับว่าชื่อนี้ไหม

// [GET] ดึงข้อมูลโปรเจกต์ทั้งหมด
exports.getAllProjects = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// [PUT] อัปเดตข้อมูลโปรเจกต์เมื่อมีการกด Save Edit
// ... โค้ดเดิมใน projectController.js (ฝั่ง Backend)
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, status, phase, 
    planStart, actualStart, planGoLive, actualGoLive, 
    tech, compliance, project_type  // 👈 เพิ่ม project_type ตรงนี้
  } = req.body;

  try {
    const updateQuery = `
      UPDATE projects 
      SET name = $1, description = $2, status = $3, phase = $4, 
          plan_start = $5, actual_start = $6, plan_go_live = $7, actual_go_live = $8,
          tech = $9, compliance = $10, project_type = $12 /* 👈 เพิ่มตรงนี้ */
      WHERE id = $11 RETURNING *
    `;
    
    const values = [
      name, description, status, phase, 
      planStart || null, actualStart || null, planGoLive || null, actualGoLive || null, 
      tech || {}, compliance || {}, id, project_type || null /* 👈 และเพิ่มตรงนี้ */
    ];
// ...
    
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
};