/**
 * @file src/services/healthScore.service.js
 * @description Computes the personalised "Antigravity Score" (0–100) for a
 * product based on its nutritional profile AND the current user's health
 * conditions and goals.
 *
 * Scoring breakdown
 * ─────────────────
 * Baseline               : 50
 * Nutriscore modifier     : a → +25 | b → +15 | c → 0 | d → -15 | e → -25
 * NOVA group modifier     : 1 → +15 | 2 → +5  | 3 → -10 | 4 → -20
 * User-condition adjust.  : diabetes + high sugar → -20, low sugar → +10
 *                           hypertension + high sodium → -15
 * User-goal adjustment    : reduce_sugar goal + sugar > 10 g → -10
 * Final result clamped to [0, 100].
 */

/** Nutriscore letter → score delta */
const NUTRISCORE_MAP = { a: 25, b: 15, c: 0, d: -15, e: -25 };

/** NOVA processing group → score delta */
const NOVA_MAP = { 1: 15, 2: 5, 3: -10, 4: -20 };

/** Sugar threshold in g / 100 g for "high sugar" classification */
const HIGH_SUGAR_THRESHOLD = 12.5;
/** Sugar threshold in g / 100 g for "low sugar" classification */
const LOW_SUGAR_THRESHOLD = 5;
/** Sodium threshold in g / 100 g for "high sodium" classification */
const HIGH_SODIUM_THRESHOLD = 0.6;

/**
 * Calculate the Antigravity health score for a scanned product.
 *
 * @param {Object} product — Normalised product object (from OFF service).
 * @param {Object} [user]  — The Mongoose User document (may be null).
 * @returns {number} Integer score between 0 and 100 (inclusive).
 */
function calculateAntigravityScore(product, user) {
  let score = 50; // baseline

  // ── Nutriscore modifier ────────────────────────────────────────────────
  const nutriscoreGrade = (product.nutriscore || 'unknown').toLowerCase();
  if (NUTRISCORE_MAP[nutriscoreGrade] !== undefined) {
    score += NUTRISCORE_MAP[nutriscoreGrade];
  }

  // ── NOVA group modifier ────────────────────────────────────────────────
  const novaGroup = product.novaGroup;
  if (novaGroup && NOVA_MAP[novaGroup] !== undefined) {
    score += NOVA_MAP[novaGroup];
  }

  // ── Nutrient values (per 100 g) ────────────────────────────────────────
  const nutrients = product.nutrients?.per100g || {};
  const sugarsPer100g = nutrients.sugars || 0;
  const sodiumPer100g = nutrients.sodium || 0;

  // ── User-specific adjustments ──────────────────────────────────────────
  if (user) {
    const conditions = user.healthConditions || [];
    const goals = user.goals || [];

    // Diabetes adjustments
    if (conditions.includes('diabetes')) {
      if (sugarsPer100g >= HIGH_SUGAR_THRESHOLD) {
        score -= 20;
      } else if (sugarsPer100g <= LOW_SUGAR_THRESHOLD) {
        score += 10;
      }
    }

    // Hypertension adjustments
    if (conditions.includes('hypertension')) {
      if (sodiumPer100g >= HIGH_SODIUM_THRESHOLD) {
        score -= 15;
      }
    }

    // Goal-based adjustments
    if (goals.includes('reduce_sugar') && sugarsPer100g > 10) {
      score -= 10;
    }
  }

  // ── Clamp to [0, 100] ─────────────────────────────────────────────────
  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { calculateAntigravityScore };
