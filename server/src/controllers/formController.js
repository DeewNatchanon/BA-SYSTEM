const fs = require('fs');
const pool = require('../config/db');

const getFormPermissions = (role) => {
  if (role === 'manager') {
    return { requesterOnly: 'write', glsItOnly: 'write', approvals: 'write' };
  }
  return { requesterOnly: 'write', glsItOnly: 'read', approvals: 'read' };
};

const getPermissions = (req, res) => {
  res.json({
    role: req.auth.role,
    permissions: getFormPermissions(req.auth.role)
  });
};

const submitForm = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาแนบไฟล์เอกสารที่เซ็นอนุมัติแล้ว' });
    }

    let formData = {};
    if (req.body.requestData) {
      formData = JSON.parse(req.body.requestData);
    }
    
    const filePath = req.file.path;
    const userId = req.auth.sub || 'unknown'; 
    const projectId = formData.requestId || `REQ-${Date.now().toString().slice(-6)}`;

    // 1. บันทึกลงตาราง Forms (ประวัติ)
    const formSql = `
      INSERT INTO forms (request_id, project_name, requester_name, form_data, document_path, submitted_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const formValues = [
      projectId,
      formData.projectName || 'Untitled Project',
      formData.requesterName || 'N/A',
      formData,     
      filePath,     
      userId
    ];
    await pool.query(formSql, formValues);

    // 🚀 2. สร้างโปรเจกต์ใหม่ (อัปเดตให้เซฟไฟล์และข้อมูลฟอร์มลงไปด้วย)
    const projectSql = `
      INSERT INTO projects (
        id, name, description, project_type, status, phase, manager, site, owner, group_dept, document_path, form_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    const isNew = (formData.projectType && formData.projectType.includes('New System')) ? 'New' : 'Enhance';

    const projectValues = [
      projectId, 
      formData.projectName || 'Untitled Project',  
      formData.projectDetail || formData.requirementDetail || 'ไม่มีคำอธิบาย',
      isNew,
      'Initiate',     
      'Requirement',  
      'รอ BA รับเรื่อง', 
      formData.requesterSite || '-', 
      formData.requesterName || '-',               
      formData.requesterDept || '-',
      filePath,  // 👈 บันทึกที่อยู่ไฟล์ (PDF) ลงตาราง projects
      formData   // 👈 บันทึกข้อมูลฟอร์ม (เพื่อให้ Modal ดึงไปโชว์ได้ครบๆ)
    ];
    await pool.query(projectSql, projectValues);

    return res.status(201).json({ message: 'บันทึกข้อมูลและสร้างโปรเจกต์สำเร็จ!' });

  } catch (error) {
    console.error('Error in submitForm:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return next(error);
  }
};

module.exports = {
  getPermissions,
  submitForm
};