const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllApprovals,
  getPendingApprovals,
  updateApproval,
  cancelBooking,
  getAllBookings
} = require('../controllers/bookingController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Employee routes
router.post('/', authenticateToken, authorize('employee', 'admin'), createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);
router.put('/:bookingId/cancel', authenticateToken, cancelBooking);

// Approver routes
router.get('/approvals/all', authenticateToken, authorize('approver', 'admin'), getAllApprovals);
router.get('/approvals/pending', authenticateToken, authorize('approver', 'admin'), getPendingApprovals);
router.put('/approvals/:approvalId', authenticateToken, authorize('approver', 'admin'), updateApproval);

// Admin routes
router.get('/all', authenticateToken, authorize('admin'), getAllBookings);

module.exports = router;
