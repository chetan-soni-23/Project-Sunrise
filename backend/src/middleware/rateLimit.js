const rateLimit = require('express-rate-limit');

// Global rate limiter — baseline protection for all API endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per IP per window
  standardHeaders: true,     // Return rate limit info in headers (RateLimit-*)
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  }
});

// Auth rate limiter — strict limits for login and registration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  }
});

// Admin rate limiter — moderate limits for admin operations
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // 30 requests per user per window
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID from JWT token for authenticated admin requests
  // Falls back to IP for unauthenticated requests (shouldn't happen)
  keyGenerator: (req) => {
    return req.user?.id?.toString() || req.ip;
  },
  message: {
    error: 'Too many admin requests. Please try again later.',
    retryAfter: '15 minutes'
  }
});

module.exports = { globalLimiter, authLimiter, adminLimiter };
