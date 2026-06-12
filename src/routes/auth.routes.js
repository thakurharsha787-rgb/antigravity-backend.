/**
 * @file src/routes/auth.routes.js
 * @description Authentication routes — Firebase ↔ MongoDB user sync.
 */

const { Router } = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { syncUser } = require('../controllers/auth.controller');

const router = Router();

/**
 * POST /api/auth/sync-user
 * Protected — requires a valid Firebase ID token.
 */
router.post('/sync-user', verifyToken, syncUser);

module.exports = router;
