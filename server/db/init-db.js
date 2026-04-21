const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const run = async () => {
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Database schema initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database schema.', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
