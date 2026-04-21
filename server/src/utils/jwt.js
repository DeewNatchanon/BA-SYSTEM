const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'ba-system-api'
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwtSecret, {
    issuer: 'ba-system-api'
  });

module.exports = {
  signAccessToken,
  verifyAccessToken
};
