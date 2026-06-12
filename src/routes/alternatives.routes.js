/**
 * @file src/routes/alternatives.routes.js
 * @description Routes for fetching healthier product alternatives.
 */

const { Router } = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getAlternatives } = require('../controllers/alternatives.controller');

const router = Router();

/**
 * GET /api/alternatives/:scanId — ranked alternatives for a previous scan.
 * Protected.
 */
router.get('/:scanId', verifyToken, getAlternatives);

module.exports = router;
