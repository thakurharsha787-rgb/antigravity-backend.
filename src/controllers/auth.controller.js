/**
 * @file src/controllers/auth.controller.js
 * @description Handles Firebase ↔ MongoDB user synchronisation.
 */

const User = require('../models/User');

/**
 * POST /api/auth/sync-user
 *
 * Receives the client-side Firebase user payload and upserts a matching
 * document in the MongoDB User collection.  Called after every Firebase
 * sign-in / sign-up so that the backend always has an up-to-date record.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function syncUser(req, res) {
  try {
    const { uid, email, displayName, photoURL, authProvider } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'uid and email are required.',
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $set: {
          email,
          displayName: displayName || '',
          photoURL: photoURL || '',
          ...(authProvider ? { authProvider } : {}),
        },
        $setOnInsert: {
          firebaseUid: uid,
          onboardingComplete: false,
          streakDays: 0,
          totalScans: 0,
          xpPoints: 0,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'User synchronised successfully.',
      data: user,
    });
  } catch (err) {
    console.error('syncUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to synchronise user.',
    });
  }
}

module.exports = { syncUser };
