// middlewares/async.middleware.js
/**
 * Middleware để xử lý async/await cho các controller
 * Giúp bắt lỗi mà không cần try/catch trong mỗi controller
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;