/**
 * @file src/routes/metrics.routes.js
 * @description Daily log and weekly trend routes.
 */

const { Router } = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getDailyLog,
  upsertDailyLog,
  getWeeklyTrend,
} = require('../controllers/metrics.controller');

const router = Router();

/**
 * GET  /api/metrics/daily   — retrieve a daily log (query: ?date=YYYY-MM-DD)
 * POST /api/metrics/daily   — create / update a daily log
 * GET  /api/metrics/weekly  — last 7-day aggregation
 *
 * All routes are protected.
 */
router.get('/daily', verifyToken, getDailyLog);
router.post('/daily', verifyToken, upsertDailyLog);
router.get('/weekly', verifyToken, getWeeklyTrend);

module.exports = router;
