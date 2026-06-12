/**
 * @file src/middleware/authMiddleware.js
 * @description Firebase ID-token verification middleware.
 * Extracts the Bearer token from the Authorization header, verifies it
 * with Firebase Admin, and attaches the decoded token to `req.user`.
 */

const { admin } = require('../config/firebase');

/**
 * Express middleware that verifies a Firebase ID token.
 *
 * Expected header format:  `Authorization: Bearer <idToken>`
 *
 * On success `req.user` is set to the decoded Firebase token which contains
 * at minimum: `uid`, `email`, `email_verified`, `name`, `picture`.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — no Bearer token provided.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — token is empty.',
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (err) {
    console.error('🔒 Token verification failed:', err.message);

    const isExpired = err.code === 'auth/id-token-expired';
    return res.status(401).json({
      success: false,
      message: isExpired
        ? 'Unauthorized — token has expired.'
        : 'Unauthorized — invalid token.',
    });
  }
}

module.exports = { verifyToken };
