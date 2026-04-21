const { z } = require('zod');
const { createUser, findUserByUsername } = require('../repositories/userRepository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(50, 'Username must be at most 50 characters.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(100, 'Password must be at most 100 characters.')
});

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(50, 'Username must be at most 50 characters.')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username allows only letters, numbers, dot, underscore, hyphen.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must be at most 100 characters.'),
  role: z.enum(['employee', 'manager']).default('employee'),
  // เพิ่มการรับค่า managerCode (ใช้ .optional() เพราะพนักงานทั่วไปไม่ต้องส่งมา)
  managerCode: z.string().optional() 
});

const buildValidationMessage = (parsedResult, fallbackMessage) => {
  if (parsedResult.success) return '';
  const message = parsedResult.error.issues.map((issue) => issue.message).join(' ');
  return message || fallbackMessage;
};

const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: buildValidationMessage(parsed, 'Invalid registration payload.')
      });
    }

    const role = parsed.data.role || 'employee';
    const managerCode = parsed.data.managerCode;

    // 🛡️ เพิ่มระบบตรวจสอบความปลอดภัยสำหรับ Manager ตรงนี้
    if (role === 'manager') {
      const correctSecret = process.env.MANAGER_SECRET_KEY;
      
      // กันเหนียว: เผื่อแอดมินลืมตั้งค่าในไฟล์ .env
      if (!correctSecret) {
        return res.status(500).json({ message: 'Server Error: ยังไม่ได้ตั้งค่ารหัสลับ Manager ในระบบ' });
      }

      // เทียบรหัสที่ผู้ใช้ส่งมา กับรหัสใน .env
      if (managerCode !== correctSecret) {
        return res.status(400).json({ message: 'รหัสอนุมัติสิทธิ์ Manager ไม่ถูกต้อง!' });
      }
    }

    const username = parsed.data.username.toLowerCase();
    const existing = await findUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    
    const newUser = await createUser({
      username,
      passwordHash,
      role
    });

    const token = signAccessToken({
      sub: newUser.id,
      username: newUser.username,
      role
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role
      }
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: buildValidationMessage(parsed, 'Invalid login payload.')
      });
    }

    const username = parsed.data.username.trim().toLowerCase();
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = signAccessToken({
      sub: user.id,
      username: user.username,
      role: user.role
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) => {
  res.json({
    user: {
      id: req.auth.sub,
      username: req.auth.username,
      role: req.auth.role
    }
  });
};

module.exports = {
  register,
  login,
  me
};