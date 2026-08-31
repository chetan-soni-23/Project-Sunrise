const express = require('express');
const router = express.Router();
const { searchHotels, getCities, getHotelById } = require('../controllers/hotelController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (optional auth for logging)
router.get('/search', authenticateToken, searchHotels);
router.get('/cities', getCities);
router.get('/:id', getHotelById);

module.exports = router;
