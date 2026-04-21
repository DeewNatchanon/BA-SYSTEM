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

module.exports = {
  requireAuth,
  requireRole
};
