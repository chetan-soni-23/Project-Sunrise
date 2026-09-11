const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, resetPassword, deleteUser } = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');

// All routes require admin role and are rate limited
router.use(authenticateToken, authorize('admin'), adminLimiter);

// User management
router.get('/users', getUsers);
router.get('/users/:userId', getUser);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.put('/users/:userId/reset-password', resetPassword);
router.delete('/users/:userId', deleteUser);

module.exports = router;
