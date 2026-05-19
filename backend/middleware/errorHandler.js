/**
 * Centralized error handler.
 */
function notFound(req, res, _next) {
  res.status(404).json({ success: false, message: `Endpoint topilmadi: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, _next) {
  console.error('💥', err);
  const status = err.status || 500;
  const message = err.expose ? err.message : (err.message || 'Server xatosi');
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

module.exports = { notFound, errorHandler, HttpError };
