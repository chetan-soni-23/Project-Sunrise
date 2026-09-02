const express = require('express');
const router = express.Router();
const {
  createDelegation,
  getMyDelegations,
  getDelegatedToMe,
  revokeDelegation,
  checkActiveDelegation
} = require('../controllers/delegationController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create a new delegation (approvers and admins only)
router.post('/', authorize('approver', 'admin'), createDelegation);

// Get my delegations (where I am the original approver)
router.get('/', getMyDelegations);

// Get delegations delegated to me
router.get('/received', getDelegatedToMe);

// Check if a delegation is active for a specific approver
router.get('/check/:approverId', checkActiveDelegation);

// Revoke a delegation
router.delete('/:delegationId', revokeDelegation);

module.exports = router;
