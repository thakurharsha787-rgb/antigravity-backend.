/**
 * @file src/controllers/user.controller.js
 * @description User profile CRUD and onboarding completion.
 */

const User = require('../models/User');

/**
 * GET /api/user
 * Retrieve the authenticated user's profile.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function getProfile(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please sync your account first.',
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
    });
  }
}

/**
 * PUT /api/user
 * Update the authenticated user's profile fields.
 *
 * Accepts any combination of: displayName, photoURL, profile,
 * goals, healthConditions, notifications.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function updateProfile(req, res) {
  try {
    const allowedFields = [
      'displayName',
      'photoURL',
      'profile',
      'goals',
      'healthConditions',
      'notifications',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated.',
      data: user,
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
}

/**
 * POST /api/user/onboarding
 * Mark onboarding as complete and persist profile, goals, and health
 * conditions submitted during the onboarding wizard.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function completeOnboarding(req, res) {
  try {
    const { profile, goals, healthConditions } = req.body;

    const updates = { onboardingComplete: true };

    if (profile) updates.profile = profile;
    if (goals) updates.goals = goals;
    if (healthConditions) updates.healthConditions = healthConditions;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Onboarding complete!',
      data: user,
    });
  } catch (err) {
    console.error('completeOnboarding error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding.',
    });
  }
}

module.exports = { getProfile, updateProfile, completeOnboarding };
