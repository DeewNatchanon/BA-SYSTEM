// 🚀 นำเข้า updateUsername
const { listUsers, updateUsername } = require('../repositories/userRepository');

const getUsers = async (req, res, next) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res) => {
  // 🚀 อ่านชื่อเก่าจาก Token ป้องกันคนแอบเปลี่ยนชื่อคนอื่น
  const oldUsername = req.auth.username; 
  const newUsername = req.body.username; 

  try {
    await updateUsername(oldUsername.toLowerCase(), newUsername.toLowerCase()); 
    res.json({ message: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ!' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') { 
        return res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีคนใช้งานแล้ว กรุณาเลือกชื่ออื่น' });
    }
    res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาดในการอัปเดต' });
  }
};

module.exports = {
  getUsers,
  updateUser
};