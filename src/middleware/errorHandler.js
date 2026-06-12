/**
 * @file src/middleware/errorHandler.js
 * @description Global Express error-handling middleware.
 * In development mode the full stack trace is returned; in production only
 * a generic message is sent to the client.
 */

/**
 * Global error handler — must be registered with four params so Express
 * recognises it as an error-handling middleware.
 *
 * @param {Error}  err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function globalErrorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  console.error(`❌ [${req.method} ${req.originalUrl}]`, err);

  res.status(statusCode).json({
    success: false,
    message: isProd ? 'Internal server error' : err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { globalErrorHandler };
