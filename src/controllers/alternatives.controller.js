/**
 * @file src/controllers/alternatives.controller.js
 * @description Controller for fetching scored product alternatives.
 */

const ScanLog = require('../models/ScanLog');
const User = require('../models/User');
const { getSmartRecommendations } = require('../services/recommendations.service');

/**
 * GET /api/alternatives/:scanId
 * Load the original scan, fetch alternatives from OFF, score them against
 * the user's profile, and return a ranked list.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function getAlternatives(req, res) {
  try {
    const { scanId } = req.params;

    if (!scanId) {
      return res.status(400).json({
        success: false,
        message: '"scanId" param is required.',
      });
    }

    // Resolve user
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Load the original scan
    const scanLog = await ScanLog.findOne({ _id: scanId, userId: user._id });
    if (!scanLog) {
      return res.status(404).json({
        success: false,
        message: 'Scan log not found.',
      });
    }

    // Fetch and score alternatives
    const alternatives = await getSmartRecommendations(scanLog, user);

    return res.status(200).json({
      success: true,
      data: {
        originalProduct: {
          name: scanLog.product.name,
          brand: scanLog.product.brand,
          antigravityScore: scanLog.antigravityScore,
        },
        alternatives,
      },
    });
  } catch (err) {
    console.error('getAlternatives error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch alternatives.',
    });
  }
}

module.exports = { getAlternatives };
