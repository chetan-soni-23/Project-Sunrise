const express = require('express');
const router = express.Router();
const { getPolicies, getPolicyByDesignation, validateBooking, upsertPolicy, deletePolicy } = require('../controllers/policyController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getPolicies);
router.get('/:designation', getPolicyByDesignation);

// Protected routes
router.post('/validate', authenticateToken, validateBooking);

// Admin only routes
router.post('/', authenticateToken, authorize('admin'), upsertPolicy);
router.delete('/:designation', authenticateToken, authorize('admin'), deletePolicy);

module.exports = router;
