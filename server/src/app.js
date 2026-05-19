const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const formRoutes = require('./routes/formRoutes');
const projectRoutes = require('./routes/projectRoutes');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const env = require('./config/env');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// 🌟 นำเข้า Database Connection ป้องกัน Server พังเวลาดึงข้อมูล
const pool = require('./config/db'); 

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browserless tools and same-machine local dev ports configured in env.
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: false
  }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ให้ระบบรู้ว่าถ้านำหน้าด้วย /api ให้ไปเรียกใช้ projectRoutes
app.use('/api', projectRoutes);

// 🚀 3. ปรับ Helmet เล็กน้อย เพื่อไม่ให้บล็อกการแสดงผลไฟล์ PDF บนเบราว์เซอร์
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use('/api/users', userRoutes); 
app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 🌟 API สำหรับระบบ Roles & Permissions 🌟
// 1. ดึงรายชื่อ Role ทั้งหมดไปแสดงในหน้า EditRole.js
app.get('/api/roles', async (req, res) => {
  try {
    // 🌟 เปลี่ยนมาใช้ pool.query เพื่อให้เชื่อมต่อฐานข้อมูลได้ถูกต้อง
    const { rows } = await pool.query('SELECT * FROM roles'); 
    res.json(rows);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. สร้าง/อัปเดตสิทธิ์ (Permissions) จากหน้า EditRole.js
app.put('/api/roles/:id', async (req, res) => {
  const roleId = req.params.id;
  const { name, permissions } = req.body; // รับก้อน JSON สิทธิ์มาจากหน้าบ้าน

  try {
    // ใช้คำสั่ง UPSERT: ถ้าไม่มี Role นี้ให้สร้างใหม่ ถ้ามีอยู่แล้วให้อัปเดต
    const query = `
      INSERT INTO roles (id, name, permissions) 
      VALUES ($1, $2, $3)
      ON CONFLICT (id) 
      DO UPDATE SET name = EXCLUDED.name, permissions = EXCLUDED.permissions
    `;
    const permissionsJson = JSON.stringify(permissions); // แปลงเป็น JSON ก่อนลง DB
    
    await pool.query(query, [roleId, name, permissionsJson]);
    res.json({ message: "อัปเดตสิทธิ์สำเร็จเรียบร้อย!" });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const projectId = req.params.id;
  const { status, phase, form_data } = req.body;

  try {
    // 🔥 จุดสำคัญ: แปลง form_data กลับเป็น String JSON ก่อนบันทึกลง Database
    const formDataJson = JSON.stringify(form_data); 

    const updateQuery = `
      UPDATE projects 
      SET status = $1, phase = $2, form_data = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    
    const result = await pool.query(updateQuery, [status, phase, formDataJson, projectId]);
    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.use('/api/forms', formRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;