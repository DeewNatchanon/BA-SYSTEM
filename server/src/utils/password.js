const bcrypt = require('bcrypt');

const hashPassword = async (plainTextPassword) => bcrypt.hash(plainTextPassword, 12);

const verifyPassword = async (plainTextPassword, passwordHash) =>
  bcrypt.compare(plainTextPassword, passwordHash);

module.exports = {
  hashPassword,
  verifyPassword
};
