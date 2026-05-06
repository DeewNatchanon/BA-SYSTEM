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

app.use('/api/forms', formRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;