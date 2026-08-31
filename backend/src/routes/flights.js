const express = require('express');
const router = express.Router();
const { searchFlights, getCities, getFlightById } = require('../controllers/flightController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (optional auth for logging)
router.get('/search', authenticateToken, searchFlights);
router.get('/cities', getCities);
router.get('/:id', getFlightById);

module.exports = router;
