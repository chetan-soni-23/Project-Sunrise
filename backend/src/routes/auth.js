const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { registerValidation, loginValidation, handleValidationErrors } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');

// Public routes (rate limited to prevent brute force and mass account creation)
router.post('/register', authLimiter, registerValidation, handleValidationErrors, register);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/profile/password', authenticateToken, changePassword);

module.exports = router;
