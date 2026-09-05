const express = require('express');
const router = express.Router();
const {
  createDelegation,
  getMyDelegations,
  getDelegatedToMe,
  updateDelegation,
  deleteDelegation,
  revokeDelegation,
  checkActiveDelegation,
  getApprovers
} = require('../controllers/delegationController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all approvers (for delegation dropdown)
router.get('/approvers', getApprovers);

// Create a new delegation (approvers and admins only)
router.post('/', authorize('approver', 'admin'), createDelegation);

// Get my delegations (where I am the original approver)
router.get('/', getMyDelegations);

// Get delegations delegated to me
router.get('/received', getDelegatedToMe);

// Check if a delegation is active for a specific approver
router.get('/check/:approverId', checkActiveDelegation);

// Update a delegation
router.put('/:delegationId', updateDelegation);

// Revoke a delegation (soft delete - sets is_active to false)
router.put('/:delegationId/revoke', revokeDelegation);

// Delete a delegation permanently
router.delete('/:delegationId', deleteDelegation);

module.exports = router;
