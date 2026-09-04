const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/profile/password', authenticateToken, changePassword);

module.exports = router;
