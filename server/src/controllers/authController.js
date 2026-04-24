const { z } = require('zod');
// 🚀 นำเข้า updateUserPassword
const { createUser, findUserByUsername, updateUserPassword } = require('../repositories/userRepository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');

const loginSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50, 'Username must be at most 50 characters.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100, 'Password must be at most 100 characters.')
});

const registerSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters.').max(50, 'Username must be at most 50 characters.').regex(/^[a-zA-Z0-9._-]+$/, 'Username allows only letters, numbers, dot, underscore, hyphen.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100, 'Password must be at most 100 characters.'),
  role: z.enum(['employee', 'manager']).default('employee'),
  managerCode: z.string().optional() 
});

// 🚀 เพิ่ม Schema สำหรับเปลี่ยนรหัสผ่าน
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
  newPassword: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
});

const buildValidationMessage = (parsedResult, fallbackMessage) => {
  if (parsedResult.success) return '';
  return parsedResult.error.issues.map((issue) => issue.message).join(' ') || fallbackMessage;
};

const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: buildValidationMessage(parsed, 'Invalid registration payload.') });

    const role = parsed.data.role || 'employee';
    const managerCode = parsed.data.managerCode;

    if (role === 'manager') {
      const correctSecret = process.env.MANAGER_SECRET_KEY;
      if (!correctSecret) return res.status(500).json({ message: 'Server Error: ยังไม่ได้ตั้งค่ารหัสลับ Manager ในระบบ' });
      if (managerCode !== correctSecret) return res.status(400).json({ message: 'รหัสอนุมัติสิทธิ์ Manager ไม่ถูกต้อง!' });
    }

    const username = parsed.data.username.toLowerCase();
    const existing = await findUserByUsername(username);
    if (existing) return res.status(409).json({ message: 'Username already exists.' });

    const passwordHash = await hashPassword(parsed.data.password);
    const newUser = await createUser({ username, passwordHash, role });

    const token = signAccessToken({ sub: newUser.id, username: newUser.username, role });
    return res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, role } });
  } catch (error) { return next(error); }
};

const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: buildValidationMessage(parsed, 'Invalid login payload.') });

    const username = parsed.data.username.trim().toLowerCase();
    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ message: 'Invalid username or password.' });

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid username or password.' });

    const token = signAccessToken({ sub: user.id, username: user.username, role: user.role });
    return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) { return next(error); }
};

const me = async (req, res) => {
  res.json({ user: { id: req.auth.sub, username: req.auth.username, role: req.auth.role } });
};

// 🚀 ระบบเปลี่ยนรหัสผ่าน
const changePassword = async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: buildValidationMessage(parsed, 'ข้อมูลไม่ถูกต้อง') });

    const user = await findUserByUsername(req.auth.username);
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้งานในระบบ' });

    const valid = await verifyPassword(parsed.data.oldPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });

    const newPasswordHash = await hashPassword(parsed.data.newPassword);
    await updateUserPassword(user.id, newPasswordHash);

    return res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย' });
  } catch (error) { return next(error); }
};

// 🚀 อย่าลืม Export changePassword
module.exports = {
  register, login, me, changePassword
};