// middlewares/socket.middleware.js
const socketService = require('../services/socket.service');

/**
 * Middleware đính kèm đối tượng socket vào request
 * để sử dụng trong các controller
 */
exports.attachSocketService = (req, res, next) => {
  req.io = socketService;
  next();
};

/**
 * Middleware kiểm tra kết nối socket của người dùng
 * Sử dụng cho các API cần real-time feedback
 */
exports.requireUserSocket = (req, res, next) => {
  const userId = req.user.id;
  
  if (!socketService.isUserOnline(userId)) {
    return next(new Error('Yêu cầu kết nối WebSocket để sử dụng tính năng này'));
  }
  
  next();
};

/**
 * Middleware yêu cầu admin phải có kết nối socket
 */
exports.requireAdminSocket = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return next(new Error('Không có quyền truy cập'));
  }
  
  const userId = req.user.id;
  
  if (!socketService.isUserOnline(userId)) {
    return next(new Error('Yêu cầu kết nối WebSocket để sử dụng tính năng này'));
  }
  
  next();
};