const pool = require('../src/config/db');
const { hashPassword } = require('../src/utils/password');

const upsertUser = async (username, plainPassword, roleName) => {
  const passwordHash = await hashPassword(plainPassword);
  await pool.query(
    `INSERT INTO users (username, password_hash, role_id)
     SELECT $1, $2, r.id
     FROM roles r
     WHERE r.name = $3
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id, is_active = TRUE`,
    [username, passwordHash, roleName]
  );
};

const run = async () => {
  try {
    await upsertUser('employee', 'employee123', 'employee');
    await upsertUser('manager', 'manager123', 'manager');
    console.log('Seeded users successfully.');
  } catch (error) {
    console.error('Failed seeding users', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
