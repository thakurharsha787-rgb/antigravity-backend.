/**
 * @file src/services/openFoodFacts.service.js
 * @description Wraps the Open Food Facts (OFF) v2 API.
 * Provides helpers to fetch a single product by barcode and to search
 * for healthier alternatives within the same category.
 */

const axios = require('axios');

const OFF_BASE = 'https://world.openfoodfacts.org';
const USER_AGENT = 'Antigravity/1.0 (health-tracker; contact@antigravity.app)';

/** Shared Axios instance with default headers required by OFF. */
const offClient = axios.create({
  baseURL: OFF_BASE,
  timeout: 10000,
  headers: { 'User-Agent': USER_AGENT },
});

/**
 * Fetch and normalise a product from Open Food Facts by its barcode.
 *
 * @param {string} barcode — EAN / UPC barcode string.
 * @returns {Promise<Object|null>} Cleaned product object or null when not found.
 */
async function getProductByBarcode(barcode) {
  try {
    const { data } = await offClient.get(`/api/v2/product/${barcode}`, {
      params: {
        fields:
          'product_name,brands,image_front_url,nutriscore_grade,nova_group,' +
          'ecoscore_grade,categories,serving_size,ingredients_text,' +
          'nutriments',
      },
    });

    if (!data || data.status === 0 || !data.product) {
      return null;
    }

    const p = data.product;
    const n = p.nutriments || {};

    return {
      name: p.product_name || 'Unknown Product',
      brand: p.brands || '',
      imageUrl: p.image_front_url || '',
      nutriscore: normaliseGrade(p.nutriscore_grade),
      novaGroup: p.nova_group || null,
      ecoScore: normaliseGrade(p.ecoscore_grade),
      categories: p.categories || '',
      servingSize: p.serving_size || '',
      ingredientsRaw: p.ingredients_text || '',
      nutrients: {
        per100g: {
          energy_kcal: n['energy-kcal_100g'] || 0,
          fat: n.fat_100g || 0,
          saturated_fat: n['saturated-fat_100g'] || 0,
          carbohydrates: n.carbohydrates_100g || 0,
          sugars: n.sugars_100g || 0,
          fiber: n.fiber_100g || 0,
          proteins: n.proteins_100g || 0,
          salt: n.salt_100g || 0,
          sodium: n.sodium_100g || 0,
        },
      },
    };
  } catch (err) {
    console.error(`OFF getProductByBarcode(${barcode}) error:`, err.message);
    throw new Error('Failed to fetch product from Open Food Facts.');
  }
}

/**
 * Search Open Food Facts for healthier alternatives within a given category.
 * Only products with nutriscore a or b are returned.
 *
 * @param {string}  category        — OFF category tag (e.g. "Breakfast cereals").
 * @param {string}  excludeBarcode  — Barcode to exclude from results.
 * @param {number}  [limit=5]       — Max results.
 * @returns {Promise<Object[]>}     Array of normalised product objects.
 */
async function getAlternatives(category, excludeBarcode, limit = 5) {
  try {
    // Use the search v2 endpoint with category and nutriscore filters.
    const { data } = await offClient.get('/cgi/search.pl', {
      params: {
        search_terms: category,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: limit + 5, // fetch extra to compensate for filtering
        sort_by: 'nutriscore_score',
        fields:
          'code,product_name,brands,image_front_url,nutriscore_grade,' +
          'nova_group,ecoscore_grade,categories,serving_size,' +
          'ingredients_text,nutriments',
      },
    });

    if (!data || !data.products) {
      return [];
    }

    const results = data.products
      .filter((p) => {
        const grade = normaliseGrade(p.nutriscore_grade);
        return (
          (grade === 'a' || grade === 'b') &&
          String(p.code) !== String(excludeBarcode)
        );
      })
      .slice(0, limit)
      .map((p) => {
        const n = p.nutriments || {};
        return {
          barcode: p.code,
          name: p.product_name || 'Unknown Product',
          brand: p.brands || '',
          imageUrl: p.image_front_url || '',
          nutriscore: normaliseGrade(p.nutriscore_grade),
          novaGroup: p.nova_group || null,
          ecoScore: normaliseGrade(p.ecoscore_grade),
          categories: p.categories || '',
          servingSize: p.serving_size || '',
          ingredientsRaw: p.ingredients_text || '',
          nutrients: {
            per100g: {
              energy_kcal: n['energy-kcal_100g'] || 0,
              fat: n.fat_100g || 0,
              saturated_fat: n['saturated-fat_100g'] || 0,
              carbohydrates: n.carbohydrates_100g || 0,
              sugars: n.sugars_100g || 0,
              fiber: n.fiber_100g || 0,
              proteins: n.proteins_100g || 0,
              salt: n.salt_100g || 0,
              sodium: n.sodium_100g || 0,
            },
          },
        };
      });

    return results;
  } catch (err) {
    console.error(`OFF getAlternatives(${category}) error:`, err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a nutriscore / ecoscore grade string to lower-case a–e or 'unknown'.
 *
 * @param {string|undefined} grade
 * @returns {'a'|'b'|'c'|'d'|'e'|'unknown'}
 */
function normaliseGrade(grade) {
  if (!grade) return 'unknown';
  const lower = String(grade).toLowerCase().trim();
  return ['a', 'b', 'c', 'd', 'e'].includes(lower) ? lower : 'unknown';
}

module.exports = { getProductByBarcode, getAlternatives };
