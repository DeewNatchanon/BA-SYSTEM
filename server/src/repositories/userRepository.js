const pool = require('../config/db');

const findUserByUsername = async (username) => {
  const result = await pool.query(
    `SELECT u.id, u.username, u.password_hash AS "passwordHash", r.name AS role, u.avatar
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = $1 AND u.is_active = TRUE`,
    [username]
  );
  return result.rows[0] || null;
};

const listUsers = async () => {
  const result = await pool.query(
    `SELECT u.id, u.username, r.name AS role, u.created_at AS "createdAt", u.is_active AS "isActive", u.avatar
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.id ASC`
  );
  return result.rows;
};

const createUser = async ({ username, passwordHash, role = 'employee' }) => {
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role_id)
     SELECT $1, $2, r.id
     FROM roles r
     WHERE r.name = $3
     RETURNING id, username`,
    [username, passwordHash, role]
  );
  return result.rows[0] || null;
};

const updateUserPassword = async (userId, newPasswordHash) => {
  const query = `UPDATE users SET password_hash = $1 WHERE id = $2`;
  await pool.query(query, [newPasswordHash, userId]);
};

// 🚀 ฟังก์ชันอัปเดตชื่อผู้ใช้ และ รูปภาพ (Avatar) - แก้ไขให้รับ 3 พารามิเตอร์
const updateUsername = async (oldUsername, newUsername, avatar) => {
  const query = `
    UPDATE users 
    SET username = $1, avatar = $2 
    WHERE username = $3 
    RETURNING id, username, avatar
  `;
  const result = await pool.query(query, [newUsername, avatar, oldUsername]);
  if (result.rowCount === 0) {
    throw new Error('ไม่พบข้อมูลผู้ใช้เดิมในระบบ');
  }
  return result.rows[0];
};

module.exports = {
  findUserByUsername,
  listUsers,
  createUser,
  updateUserPassword,
  updateUsername
};