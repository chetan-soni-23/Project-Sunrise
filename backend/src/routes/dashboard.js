const express = require('express');
const router = express.Router();
const { getDashboardStats, getUserStats } = require('../controllers/dashboardController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Admin dashboard
router.get('/stats', authenticateToken, authorize('admin'), getDashboardStats);

// User dashboard
router.get('/my-stats', authenticateToken, getUserStats);

module.exports = router;
