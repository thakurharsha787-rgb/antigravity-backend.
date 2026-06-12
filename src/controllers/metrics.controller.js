/**
 * @file src/controllers/metrics.controller.js
 * @description Daily log and weekly trend endpoints.
 */

const DailyLog = require('../models/DailyLog');
const User = require('../models/User');

/**
 * GET /api/metrics/daily?date=YYYY-MM-DD
 * Retrieve a single day's log for the authenticated user.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function getDailyLog(req, res) {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Query param "date" is required in YYYY-MM-DD format.',
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const log = await DailyLog.findOne({ userId: user._id, date }).lean();

    return res.status(200).json({
      success: true,
      data: log || null,
    });
  } catch (err) {
    console.error('getDailyLog error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily log.',
    });
  }
}

/**
 * POST /api/metrics/daily
 * Create or update (upsert) a daily log keyed by date.
 *
 * Body must include `date` (YYYY-MM-DD). All other DailyLog fields are
 * optional and will be merged via `$set`.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function upsertDailyLog(req, res) {
  try {
    const { date, ...fields } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: '"date" is required in YYYY-MM-DD format.',
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const log = await DailyLog.findOneAndUpdate(
      { userId: user._id, date },
      { $set: { ...fields, userId: user._id, date } },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Daily log saved.',
      data: log,
    });
  } catch (err) {
    console.error('upsertDailyLog error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save daily log.',
    });
  }
}

/**
 * GET /api/metrics/weekly
 * Aggregate the last 7 calendar days of logs for the authenticated user.
 *
 * Returns the individual day entries plus summary averages.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function getWeeklyTrend(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Build the last 7 date strings (today → 6 days ago).
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const logs = await DailyLog.find({
      userId: user._id,
      date: { $in: dates },
    })
      .sort({ date: 1 })
      .lean();

    // Compute averages across the available days.
    const count = logs.length || 1;
    const avg = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      healthScore: 0,
      waterMl: 0,
      sleepHours: 0,
      stepsCount: 0,
    };

    for (const log of logs) {
      avg.calories += log.consumed?.calories || 0;
      avg.protein += log.consumed?.protein || 0;
      avg.carbs += log.consumed?.carbs || 0;
      avg.fat += log.consumed?.fat || 0;
      avg.healthScore += log.healthScore || 0;
      avg.waterMl += log.waterMl || 0;
      avg.sleepHours += log.sleepHours || 0;
      avg.stepsCount += log.stepsCount || 0;
    }

    for (const key of Object.keys(avg)) {
      avg[key] = Math.round((avg[key] / count) * 10) / 10;
    }

    return res.status(200).json({
      success: true,
      data: {
        days: logs,
        averages: avg,
        totalDaysLogged: logs.length,
      },
    });
  } catch (err) {
    console.error('getWeeklyTrend error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve weekly trend.',
    });
  }
}

module.exports = { getDailyLog, upsertDailyLog, getWeeklyTrend };
