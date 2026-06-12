/**
 * @file src/routes/scan.routes.js
 * @description Barcode scanning and scan history routes.
 */

const { Router } = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  scanBarcode,
  getScanHistory,
} = require('../controllers/scan.controller');

const router = Router();

/**
 * POST /api/scan/barcode  — scan a product barcode
 * GET  /api/scan/history  — paginated scan history
 *
 * All routes are protected.
 */
router.post('/barcode', verifyToken, scanBarcode);
router.get('/history', verifyToken, getScanHistory);

module.exports = router;
