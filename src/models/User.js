/**
 * @file src/models/User.js
 * @description Mongoose model for application users.
 * Stores Firebase identity info, profile metrics, goals, health conditions,
 * gamification counters, and notification preferences.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @typedef {Object} UserProfile
 * @property {number} age
 * @property {string} gender
 * @property {number} heightCm
 * @property {number} weightKg
 * @property {number} targetWeightKg
 * @property {string} activityLevel
 */

const profileSchema = new Schema(
  {
    age: { type: Number, min: 1, max: 150 },
    gender: {
      type: String,
      enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'],
    },
    heightCm: { type: Number, min: 50, max: 300 },
    weightKg: { type: Number, min: 10, max: 500 },
    targetWeightKg: { type: Number, min: 10, max: 500 },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
    },
  },
  { _id: false }
);

const notificationsSchema = new Schema(
  {
    dailyReminder: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    scanTips: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    /** Firebase UID — primary identity link */
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: { type: String, required: true },
    displayName: { type: String, default: '' },
    photoURL: { type: String, default: '' },

    authProvider: {
      type: String,
      enum: ['google', 'apple', 'email', 'phone', 'anonymous'],
      default: 'email',
    },

    /** Physical / lifestyle profile filled during onboarding */
    profile: { type: profileSchema, default: () => ({}) },

    /** User-selected health goals */
    goals: [
      {
        type: String,
        enum: [
          'lose_weight',
          'gain_weight',
          'maintain_weight',
          'build_muscle',
          'eat_healthier',
          'reduce_sugar',
          'reduce_sodium',
          'increase_protein',
          'increase_fiber',
          'improve_sleep',
          'stay_hydrated',
        ],
      },
    ],

    /** Known health conditions for personalised scoring */
    healthConditions: [
      {
        type: String,
        enum: [
          'diabetes',
          'hypertension',
          'celiac_disease',
          'lactose_intolerance',
          'gluten_sensitivity',
          'heart_disease',
          'high_cholesterol',
          'kidney_disease',
          'none',
        ],
      },
    ],

    /** Whether the user completed the onboarding wizard */
    onboardingComplete: { type: Boolean, default: false },

    // Gamification
    streakDays: { type: Number, default: 0, min: 0 },
    totalScans: { type: Number, default: 0, min: 0 },
    xpPoints: { type: Number, default: 0, min: 0 },

    /** Notification preferences */
    notifications: { type: notificationsSchema, default: () => ({}) },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);
