/**
 * @file src/services/recommendations.service.js
 * @description Generates smart product recommendations by fetching
 * alternatives from Open Food Facts, scoring each with the Antigravity
 * algorithm, and returning them sorted best-first.
 */

const { getAlternatives } = require('./openFoodFacts.service');
const { calculateAntigravityScore } = require('./healthScore.service');

/**
 * Build a ranked list of healthier alternatives for a scanned product.
 *
 * @param {Object} scanLog — The ScanLog Mongoose document for the original scan.
 * @param {Object} user    — The User Mongoose document (for personalised scoring).
 * @returns {Promise<Object[]>} Array of alternative products sorted by
 *   antigravityScore descending.  Each entry includes the product data plus
 *   the computed `antigravityScore`.
 */
async function getSmartRecommendations(scanLog, user) {
  const category = scanLog.product?.categories || '';

  if (!category) {
    return [];
  }

  // Grab the primary (first) category for a more focused search.
  const primaryCategory = category.split(',')[0].trim();

  const alternatives = await getAlternatives(
    primaryCategory,
    scanLog.barcode,
    5
  );

  if (!alternatives.length) {
    return [];
  }

  // Score each alternative against the user's profile.
  const scored = alternatives.map((alt) => {
    const antigravityScore = calculateAntigravityScore(alt, user);
    return { ...alt, antigravityScore };
  });

  // Sort descending by antigravityScore.
  scored.sort((a, b) => b.antigravityScore - a.antigravityScore);

  return scored;
}

module.exports = { getSmartRecommendations };
