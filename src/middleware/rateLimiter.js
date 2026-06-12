/**
 * @file src/middleware/rateLimiter.js
 * @description Express rate-limiter — 100 requests per 15-minute window.
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter.
 * 100 requests per 15-minute sliding window per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate-limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests — please try again after 15 minutes.',
  },
});

module.exports = { apiLimiter };
