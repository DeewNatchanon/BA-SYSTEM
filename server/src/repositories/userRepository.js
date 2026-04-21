const pool = require('../config/db');

const findUserByUsername = async (username) => {
  const result = await pool.query(
    `SELECT u.id, u.username, u.password_hash AS "passwordHash", r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = $1 AND u.is_active = TRUE`,
    [username]
  );
  return result.rows[0] || null;
};

const listUsers = async () => {
  const result = await pool.query(
    `SELECT u.id, u.username, r.name AS role, u.created_at AS "createdAt", u.is_active AS "isActive"
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

module.exports = {
  findUserByUsername,
  listUsers,
  createUser
};
