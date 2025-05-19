// middlewares/auth.middleware.js
const passport = require('passport');
const ApiError = require('../utils/apiError');

/**
 * Middleware bảo vệ route - yêu cầu người dùng đã đăng nhập
 */
exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(new ApiError('Lỗi xác thực', 500));
    }
    
    if (!user) {
      return next(
        new ApiError('Bạn cần đăng nhập để truy cập tính năng này', 401)
      );
    }
    
    // Gán thông tin người dùng vào request
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware xác thực không bắt buộc - nếu có token thì xác thực, không có thì vẫn cho phép tiếp tục
 */
exports.optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

/**
 * Middleware giới hạn vai trò truy cập - chỉ cho phép những vai trò cụ thể
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError('Bạn cần đăng nhập để truy cập tính năng này', 401)
      );
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('Bạn không có quyền truy cập tính năng này', 403)
      );
    }
    
    next();
  };
};

/**
 * Xác thực tài khoản chính chủ hoặc admin
 */
exports.authorizeOwnerOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    // Admin có toàn quyền truy cập
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Người dùng chỉ được truy cập tài nguyên của chính họ
    const resourceUserId = req.params[paramName];
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      return next(
        new ApiError('Bạn không có quyền truy cập tài nguyên này', 403)
      );
    }
    
    next();
  };
};