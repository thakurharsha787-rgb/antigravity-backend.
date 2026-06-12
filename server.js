/**
 * @file server.js
 * @description Main entry point for the Antigravity backend.
 * Bootstraps Express, connects middleware, mounts routes, and starts listening.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const { globalErrorHandler } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Route modules
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const metricsRoutes = require('./src/routes/metrics.routes');
const scanRoutes = require('./src/routes/scan.routes');
const alternativesRoutes = require('./src/routes/alternatives.routes');

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

/** Security headers */
app.use(helmet());

/** CORS — allow the configured client origin (falls back to *) */
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

/** Request logging — concise in prod, verbose in dev */
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/** Body parsing */
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

/** Rate limiting (applied to /api routes) */
app.use('/api', apiLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Health-check endpoint */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/alternatives', alternativesRoutes);

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---------------------------------------------------------------------------
// Global error handler (must be last)
// ---------------------------------------------------------------------------
app.use(globalErrorHandler);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT, 10) || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `🚀 Antigravity server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
    );
  });
})();

module.exports = app;
