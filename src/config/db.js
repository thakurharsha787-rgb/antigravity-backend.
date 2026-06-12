/**
 * @file src/config/db.js
 * @description Mongoose connection helper with automatic retry logic.
 */

const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with retry logic.
 * Re-attempts up to {@link MAX_RETRIES} times before exiting the process.
 *
 * @returns {Promise<void>}
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        // Mongoose 8 uses the new driver defaults; no need for deprecated flags.
      });
      console.log('✅ MongoDB connected successfully.');
      return;
    } catch (err) {
      console.error(
        `⚠️  MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`
      );
      if (attempt === MAX_RETRIES) {
        console.error('❌ Could not connect to MongoDB. Exiting.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

module.exports = connectDB;
