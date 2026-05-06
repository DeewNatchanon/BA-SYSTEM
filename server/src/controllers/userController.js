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
  const oldUsername = req.auth.username; 
  const newUsername = req.body.username; 
  const avatar = req.body.avatar; // 🚀 รับรูปภาพ Base64 มาจาก Request

  try {
    // 🚀 ส่งชื่อเก่า, ชื่อใหม่ และ รูปภาพ เข้าไปอัปเดตในฐานข้อมูล
    const updatedUser = await updateUsername(
      oldUsername.toLowerCase(), 
      newUsername.toLowerCase(), 
      avatar || null
    ); 
    
    res.json({ 
      message: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ!',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error("Update User Error:", error);
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