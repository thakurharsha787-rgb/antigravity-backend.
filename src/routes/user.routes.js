/**
 * @file src/routes/user.routes.js
 * @description User profile routes.
 */

const { Router } = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  completeOnboarding,
} = require('../controllers/user.controller');

const router = Router();

/**
 * GET  /api/user          — retrieve profile
 * PUT  /api/user          — update profile fields
 * POST /api/user/onboarding — complete onboarding wizard
 *
 * All routes are protected.
 */
router.get('/', verifyToken, getProfile);
router.put('/', verifyToken, updateProfile);
router.post('/onboarding', verifyToken, completeOnboarding);

module.exports = router;
