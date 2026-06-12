/**
 * @file src/models/ScanLog.js
 * @description Mongoose model for individual product scans.
 * Records the raw OFF data, parsed ingredients with risk levels,
 * the computed Antigravity score, and user interaction flags.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ingredientSchema = new Schema(
  {
    name: { type: String, required: true },
    riskLevel: {
      type: String,
      enum: ['safe', 'moderate', 'harmful', 'unknown'],
      default: 'unknown',
    },
    description: { type: String, default: '' },
    e_number: { type: String, default: '' },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, default: 'Unknown Product' },
    brand: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    nutriscore: {
      type: String,
      enum: ['a', 'b', 'c', 'd', 'e', 'unknown'],
      default: 'unknown',
    },
    novaGroup: { type: Number, min: 1, max: 4 },
    ecoScore: {
      type: String,
      enum: ['a', 'b', 'c', 'd', 'e', 'unknown'],
      default: 'unknown',
    },
    categories: { type: String, default: '' },
    servingSize: { type: String, default: '' },
  },
  { _id: false }
);

const nutrientsPer100gSchema = new Schema(
  {
    energy_kcal: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    saturated_fat: { type: Number, default: 0 },
    carbohydrates: { type: Number, default: 0 },
    sugars: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    proteins: { type: Number, default: 0 },
    salt: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
  },
  { _id: false }
);

const scanLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    barcode: { type: String, required: true },
    scannedAt: { type: Date, default: Date.now },

    /** Parsed product info from OpenFoodFacts */
    product: { type: productSchema, default: () => ({}) },

    /** Nutrient values per 100 g / 100 ml */
    nutrients: {
      per100g: { type: nutrientsPer100gSchema, default: () => ({}) },
    },

    /** Ingredient analysis */
    ingredients: [ingredientSchema],

    /** Personalised Antigravity health score 0–100 */
    antigravityScore: { type: Number, min: 0, max: 100, default: 50 },

    /** User interactions */
    isBookmarked: { type: Boolean, default: false },
    userRating: { type: Number, min: 1, max: 5 },
    addedToLog: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ScanLog', scanLogSchema);
