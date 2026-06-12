/**
 * @file src/controllers/scan.controller.js
 * @description Barcode scanning and scan-history endpoints.
 */

const User = require('../models/User');
const ScanLog = require('../models/ScanLog');
const { getProductByBarcode } = require('../services/openFoodFacts.service');
const { calculateAntigravityScore } = require('../services/healthScore.service');

/**
 * POST /api/scan/barcode
 * Scan a product barcode: fetch from OFF, compute the Antigravity score,
 * persist a ScanLog, and increment the user's totalScans counter.
 *
 * Body: `{ barcode: string }`
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function scanBarcode(req, res) {
  try {
    const { barcode } = req.body;

    if (!barcode || typeof barcode !== 'string') {
      return res.status(400).json({
        success: false,
        message: '"barcode" (string) is required.',
      });
    }

    // Resolve internal user
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Fetch product from Open Food Facts
    const product = await getProductByBarcode(barcode);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with barcode "${barcode}" not found on Open Food Facts.`,
      });
    }

    // Calculate personalised score
    const antigravityScore = calculateAntigravityScore(product, user);

    // Parse ingredients into structured array
    const ingredients = parseIngredients(product.ingredientsRaw);

    // Persist scan log
    const scanLog = await ScanLog.create({
      userId: user._id,
      barcode,
      scannedAt: new Date(),
      product: {
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        nutriscore: product.nutriscore,
        novaGroup: product.novaGroup,
        ecoScore: product.ecoScore,
        categories: product.categories,
        servingSize: product.servingSize,
      },
      nutrients: { per100g: product.nutrients.per100g },
      ingredients,
      antigravityScore,
    });

    // Increment user scan counter
    await User.updateOne(
      { _id: user._id },
      { $inc: { totalScans: 1, xpPoints: 10 } }
    );

    return res.status(201).json({
      success: true,
      message: 'Product scanned successfully.',
      data: scanLog,
    });
  } catch (err) {
    console.error('scanBarcode error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to scan barcode.',
    });
  }
}

/**
 * GET /api/scan/history?page=1&limit=20
 * Paginated scan history for the authenticated user.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
async function getScanHistory(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      ScanLog.find({ userId: user._id })
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ScanLog.countDocuments({ userId: user._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        scans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('getScanHistory error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve scan history.',
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Naively parse a raw ingredients string into structured objects.
 * Real-world usage would benefit from a dedicated NLP / ingredient DB.
 *
 * @param {string} raw — Comma-separated ingredients text from OFF.
 * @returns {Array<{name:string, riskLevel:string, description:string, e_number:string}>}
 */
function parseIngredients(raw) {
  if (!raw) return [];

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => {
      const eMatch = name.match(/\b(E\d{3,4}[a-z]?)\b/i);
      return {
        name,
        riskLevel: classifyIngredientRisk(name),
        description: '',
        e_number: eMatch ? eMatch[1].toUpperCase() : '',
      };
    });
}

/**
 * Very simple heuristic risk classification based on keyword matching.
 *
 * @param {string} name
 * @returns {'safe'|'moderate'|'harmful'|'unknown'}
 */
function classifyIngredientRisk(name) {
  const lower = name.toLowerCase();

  const harmful = [
    'high fructose corn syrup',
    'hydrogenated',
    'partially hydrogenated',
    'aspartame',
    'saccharin',
    'sodium nitrite',
    'monosodium glutamate',
    'msg',
    'bha',
    'bht',
    'potassium bromate',
  ];
  if (harmful.some((h) => lower.includes(h))) return 'harmful';

  const moderate = [
    'sugar',
    'palm oil',
    'dextrose',
    'maltodextrin',
    'corn syrup',
    'artificial',
    'modified starch',
    'flavour',
    'flavor',
    'colour',
    'color',
  ];
  if (moderate.some((m) => lower.includes(m))) return 'moderate';

  const safe = [
    'water',
    'salt',
    'flour',
    'milk',
    'butter',
    'egg',
    'rice',
    'oat',
    'wheat',
    'olive oil',
    'sunflower oil',
    'vitamin',
    'mineral',
  ];
  if (safe.some((s) => lower.includes(s))) return 'safe';

  return 'unknown';
}

module.exports = { scanBarcode, getScanHistory };
