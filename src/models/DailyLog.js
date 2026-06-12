/**
 * @file src/models/DailyLog.js
 * @description Mongoose model for a user's daily nutrition / wellness log.
 * Each document represents a single calendar day. A compound unique index
 * on (userId, date) prevents duplicate entries.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const nutrientsSubDoc = {
  calories: { type: Number, default: 0, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fat: { type: Number, default: 0, min: 0 },
  fiber: { type: Number, default: 0, min: 0 },
  sugar: { type: Number, default: 0, min: 0 },
  sodium: { type: Number, default: 0, min: 0 },
  water: { type: Number, default: 0, min: 0 },
};

const dailyLogSchema = new Schema(
  {
    /** Reference to the User document */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Calendar date in YYYY-MM-DD format */
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    /** Actual consumed nutrients for the day */
    consumed: {
      type: new Schema(nutrientsSubDoc, { _id: false }),
      default: () => ({}),
    },

    /** Target nutrient goals for the day */
    targets: {
      type: new Schema(nutrientsSubDoc, { _id: false }),
      default: () => ({}),
    },

    /** Computed daily health score 0–100 */
    healthScore: { type: Number, min: 0, max: 100, default: 0 },

    /** Subjective mood rating 1–5 */
    moodRating: { type: Number, min: 1, max: 5 },

    /** Subjective energy level 1–5 */
    energyLevel: { type: Number, min: 1, max: 5 },

    /** Hours of sleep */
    sleepHours: { type: Number, min: 0, max: 24 },

    /** Step counter */
    stepsCount: { type: Number, min: 0, default: 0 },

    /** Water intake in millilitres */
    waterMl: { type: Number, min: 0, default: 0 },

    /** Number of product scans performed today */
    scansToday: { type: Number, min: 0, default: 0 },

    /** Whether this day counts toward an active streak */
    streakActive: { type: Boolean, default: false },

    /** Free-text notes */
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

/** Prevent duplicate logs for the same user + date */
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
