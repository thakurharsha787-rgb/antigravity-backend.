/**
 * @file src/models/Goal.js
 * @description Mongoose model for user-defined health goals.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const goalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Goal type identifier */
    type: {
      type: String,
      required: true,
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
        'custom',
      ],
    },

    /** Human-readable label */
    label: { type: String, required: true },

    /** Numeric target to hit */
    targetValue: { type: Number, required: true },

    /** Current progress toward the target */
    currentValue: { type: Number, default: 0 },

    /** Unit of measurement (kg, g, ml, hours, steps, etc.) */
    unit: { type: String, required: true },

    /** Optional deadline for the goal */
    deadline: { type: Date },

    /** Whether the goal is currently being tracked */
    isActive: { type: Boolean, default: true },

    /** Whether the goal has been completed */
    isCompleted: { type: Boolean, default: false },

    /** Timestamp when the goal was marked complete */
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);
