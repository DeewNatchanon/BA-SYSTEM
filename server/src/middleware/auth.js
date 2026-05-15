const { verifyAccessToken } = require('../utils/jwt');

const extractBearerToken = (authHeader = '') => {
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
};

const requireAuth = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    req.auth = verifyAccessToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth?.role || !allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({ message: 'Forbidden for your role.' });
  }
  return next();
};

// 🌟 เพิ่ม Middleware ตัวใหม่สำหรับเช็คสิทธิ์ระดับลึก (Permissions)
const requirePermission = (moduleName, action) => {
  return (req, res, next) => {
    // ดึง permissions ออกมาจาก Payload ของ Token
    const userPermissions = req.auth?.permissions || {};

    // เช็คว่า User มีสิทธิ์ใน module และ action ตามที่กำหนดหรือไม่
    const hasPermission = userPermissions[moduleName] && userPermissions[moduleName].includes(action);

    if (!hasPermission) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ดำเนินการนี้ (Forbidden)' });
    }

    return next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission // 🌟 Export ฟังก์ชันใหม่ไปใช้งาน
};