const { listUsers } = require('../repositories/userRepository');

const getUsers = async (req, res, next) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers
};
