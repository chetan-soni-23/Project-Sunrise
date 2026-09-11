const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { registerValidation, loginValidation, handleValidationErrors } = require('../middleware/validate');

// Public routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/profile/password', authenticateToken, changePassword);

module.exports = router;
