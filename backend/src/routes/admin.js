const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, resetPassword, deleteUser } = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require admin role
router.use(authenticateToken, authorize('admin'));

// User management
router.get('/users', getUsers);
router.get('/users/:userId', getUser);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.put('/users/:userId/reset-password', resetPassword);
router.delete('/users/:userId', deleteUser);

module.exports = router;
