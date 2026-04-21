const express = require('express');
const { getUsers } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('manager'), getUsers);

module.exports = router;
