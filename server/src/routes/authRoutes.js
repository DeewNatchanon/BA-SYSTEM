const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const { requireAuth, requirePermission } = require('../middleware/auth'); 
const { signAccessToken } = require('../utils/jwt');
const { verifyPassword } = require('../utils/password');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' });
        }

        const userQuery = `
            SELECT u.*, r.name AS role_name, r.permissions 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.username = $1
        `;
        const userResult = await pool.query(userQuery, [username]);
        let user = userResult.rows[0];

        if (!user) return res.status(401).json({ error: 'คุณยังไม่มีสิทธิ์เข้าใช้งานระบบนี้ กรุณาติดต่อ Admin' });
        if (!user.password_hash) return res.status(401).json({ error: 'บัญชีนี้ยังไม่ได้ตั้งค่ารหัสผ่านในระบบ' });

        const isMatch = await verifyPassword(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'รหัสพนักงาน หรือรหัสผ่าน ไม่ถูกต้อง' });

        const token = signAccessToken({ 
            sub: user.id, 
            username: user.username, 
            role: user.role_name,
            permissions: user.permissions || {}
        });

        res.json({ 
            token, 
            user: { 
                id: user.id, username: user.username, role: user.role_name, 
                avatar: user.avatar || null, permissions: user.permissions || {}
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.split(" ")[1];
        const userId = req.auth?.sub || req.auth?.id || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'ไม่พบข้อมูลใน Token' });

        const userQuery = `SELECT u.*, r.name AS role_name, r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1`;
        const userResult = await pool.query(userQuery, [userId]);
        const dbUser = userResult.rows[0];
        if (!dbUser) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });

        res.json({
            token: accessToken, 
            user: { id: dbUser.id, username: dbUser.username, role: dbUser.role_name, avatar: dbUser.avatar || null, permissions: dbUser.permissions || {} }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

router.get('/roles', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/roles/:id', requireAuth,async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body;
    try {
        await pool.query('UPDATE roles SET permissions = $1::jsonb WHERE id = $2', [JSON.stringify(permissions), id]);
        res.json({ message: 'บันทึกสิทธิ์เรียบร้อยแล้ว' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/roles', requireAuth, async (req, res) => {
    const { name, permissions } = req.body;
    try {
        const result = await pool.query('INSERT INTO roles (name, permissions) VALUES ($1, $2::jsonb) RETURNING *', [name, JSON.stringify(permissions || {})]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message }); 
    }
});

router.delete('/roles/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const roleRes = await pool.query('SELECT name FROM roles WHERE id = $1', [id]);
        if (roleRes.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูลบทบาทนี้' });
        const roleName = roleRes.rows[0].name.toLowerCase();
        if (['employee', 'manager', 'ceo'].includes(roleName)) return res.status(400).json({ error: 'ไม่อนุญาตให้ลบ Role หลักของระบบได้ (employee, manager, ceo)' });

        const empRes = await pool.query("SELECT id FROM roles WHERE name = 'employee'");
        if (empRes.rows.length === 0) return res.status(500).json({ error: 'ระบบไม่พบ Role employee พื้นฐาน' });
        const empRoleId = empRes.rows[0].id;

        await pool.query('UPDATE users SET role_id = $1 WHERE role_id = $2', [empRoleId, id]);
        await pool.query('DELETE FROM roles WHERE id = $1', [id]);

        res.json({ message: 'ลบข้อมูลสำเร็จ และย้ายผู้ใช้งานไปที่ Employee แล้ว' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;