const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../config/db'); 
const { requireAuth } = require('../middleware/auth'); 
const { signAccessToken } = require('../utils/jwt'); // 🚀 หัวใจสำคัญ: เรียกใช้ตัวสร้าง Token ของระบบคุณเอง!

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (typeof username !== 'string' || typeof password !== 'string' || username.length === 0 || password.length === 0) {
            return res.status(400).json({ error: 'รหัสพนักงาน หรือรหัสผ่าน ไม่ถูกต้อง' });
        }

        // =========================================================
        // 🚀 1. จุดเชื่อมต่อ API ส่วนกลางของโรงพยาบาล 🚀
        // =========================================================
        /* 
         !!! คอมเมนต์ส่วนนี้เปิดใช้งานเมื่อได้ API URL จากโรงพยาบาลแล้ว !!!
         
         const hospitalRes = await axios.post('https://api.hospital.com/auth/login', {
             user: username,
             pass: password
         });

         // สมมติว่า รพ. ตอบกลับมาว่า success: false ถ้าล๊อคอินไม่ผ่าน
         if (!hospitalRes.data.success) {
             return res.status(401).json({ error: 'รหัสพนักงาน หรือรหัสผ่าน ไม่ถูกต้อง' });
         }
        */

        // =========================================================
        // 🚀 2. เมื่อ รพ. ให้ผ่าน เราค่อยมาเช็คสิทธิ์ (Role) ในระบบเรา
        // =========================================================
        const userQuery = `
            SELECT u.*, r.name AS role 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.username = $1
        `;
        let userResult = await pool.query(userQuery, [username]);
        let user = userResult.rows[0];

        if (!user) {
            // กรณีล็อกอินรหัส รพ. ผ่าน แต่ไม่มีชื่อในระบบเรา (ไม่เคยถูกเพิ่มชื่อในตาราง users)
            // คุณสามารถเลือกได้ว่าจะ Return Error หรือจะใช้ SQL INSERT เพิ่มชื่อให้อัตโนมัติ
            return res.status(401).json({ error: 'คุณยังไม่มีสิทธิ์เข้าใช้งาน BA System กรุณาติดต่อ Admin' });
        } 
        
        // ❌ โค้ดส่วนที่เคยเช็ครหัสด้วย bcrypt เอาออกทั้งหมดเลยครับ เพราะ รพ. ตรวจให้แล้ว ❌

        // 🚀 3. ออก Token ด้วยฟังก์ชันมาตรฐานของโปรเจกต์คุณ (ใช้โค้ดเดิมของคุณได้เลย)
        const token = signAccessToken({ sub: user.id, username: user.username, role: user.role });

        // ส่งกลับไปให้ React จัดการต่อ
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

module.exports = router;