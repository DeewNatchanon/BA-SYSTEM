const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const pool = require('../config/db'); 
const { requireAuth } = require('../middleware/auth'); 
const { signAccessToken } = require('../utils/jwt'); // 🚀 หัวใจสำคัญ: เรียกใช้ตัวสร้าง Token ของระบบคุณเอง!

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (typeof username !== 'string' || typeof password !== 'string' || username.length === 0 || password.length === 0) {
            return res.status(400).json({ error: 'รหัสพนักงาน หรือรหัสผ่าน ไม่ถูกต้อง' });
        }

        // 1. ค้นหาผู้ใช้ในฐานข้อมูล BA System 
        const userQuery = `
            SELECT u.*, r.name AS role 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.username = $1
        `;
        let userResult = await pool.query(userQuery, [username]);
        let user = userResult.rows[0];

        // 2. ปิดการสร้างบัญชีอัตโนมัติ: ถ้าไม่พบผู้ใช้ในระบบ ให้แจ้งกลับทันทีว่าหาไม่เจอ
        if (!user) {
            return res.status(401).json({ error: 'รหัสพนักงาน หรือรหัสผ่าน ไม่ถูกต้อง' });
        } 
        
        // 3. ตรวจรหัสผ่าน (ทำงานเมื่อมี user ในระบบแล้วเท่านั้น)
        if (!user.password_hash) {
            return res.status(401).json({ error: 'รหัสพนักงาน หรือรหัสผ่าน ไม่ถูกต้อง' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'รหัสพนักงาน หรือรหัสผ่าน ไม่ถูกต้อง' });
        }

        // 🚀 4. ออก Token ด้วยฟังก์ชันมาตรฐานของโปรเจกต์คุณ
        const token = signAccessToken({ sub: user.id, username: user.username, role: user.role });

        // ป้องกัน Error กรณี user.avatar เป็น undefined
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, avatar: user.avatar || null } });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

/* =========================================================
   เส้นทาง: /me (ยืนยันตัวตนว่า Token ถูกต้อง และดึงข้อมูล)
   ========================================================= */
router.get('/me', requireAuth, async (req, res) => {
    try {
        // 🚀 ป้องกัน Error แบบ Optional Chaining เผื่อ req.auth ไม่มีอยู่จริง
        const userId = req.auth?.sub || req.auth?.id || req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้งานใน Token' });
        }

        // 🚀 JOIN กับตาราง roles เพื่อเอาชื่อ role กลับไปให้ React ด้วย
        const userQuery = `
            SELECT u.*, r.name AS role 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `;
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        
        const dbUser = userResult.rows[0];
        res.json({ 
            user: {
                id: dbUser.id,
                username: dbUser.username,
                role: dbUser.role,
                avatar: dbUser.avatar || null
            }
        });
    } catch (error) {
        console.error("Me Route Error:", error);
        // แสดง Error กลับไปให้หน้าเว็บเห็นด้วย จะได้รู้ว่าพังที่จุดไหน
        res.status(500).json({ error: error.message || 'Server Error' });
    }
});

/* =========================================================
   เส้นทาง: /change-password (สำหรับหน้า Settings)
   ========================================================= */
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.auth?.sub || req.auth?.id || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้งานใน Token' });
        }

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
        }

        const userResult = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งานในระบบ' });
        }

        const currentPasswordHash = userResult.rows[0].password_hash;
        const isValidOldPassword = await bcrypt.compare(oldPassword, currentPasswordHash);

        if (!isValidOldPassword) {
            return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }
        
        // เข้ารหัส (Hash) รหัสผ่านใหม่ก่อนบันทึกลงฐานข้อมูล
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, userId]);
        
        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
    }
});

module.exports = router;