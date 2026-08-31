const express = require('express');
const router = express.Router();
const { getPolicies, getPolicyByDesignation, validateBooking, upsertPolicy } = require('../controllers/policyController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getPolicies);
router.get('/:designation', getPolicyByDesignation);

// Protected routes
router.post('/validate', authenticateToken, validateBooking);

// Admin only routes
router.post('/', authenticateToken, authorize('admin'), upsertPolicy);

module.exports = router;
