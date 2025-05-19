// routes/api/socket.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');
const socketService = require('../../services/socket.service');
const asyncHandler = require('../../middlewares/async.middleware');
const ApiError = require('../../utils/apiError');
const ApiResponse = require('../../utils/apiResponse');

// @route   /api/socket

/**
 * @desc      Kiểm tra trạng thái hoạt động của Socket.IO server
 * @route     GET /api/socket/status
 * @access    Public
 */
router.get('/status', (req, res) => {
  return ApiResponse.success(res, {
    active: !!socketService.io,
    connectedClients: socketService.io ? socketService.io.engine.clientsCount : 0
  }, 'Socket.IO server status');
});

/**
 * @desc      Kiểm tra trạng thái kết nối của người dùng
 * @route     GET /api/socket/user-status/:userId
 * @access    Private (Admin)
 */
router.get(
  '/user-status/:userId', 
  protect, 
  authorize('admin', 'staff'), 
  asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    
    if (!userId) {
      return next(new ApiError('Vui lòng cung cấp ID người dùng', 400));
    }
    
    const isOnline = socketService.isUserOnline(userId);
    const sockets = socketService.getUserSockets(userId);
    
    return ApiResponse.success(res, {
      userId,
      isOnline,
      socketCount: sockets.length,
      sockets
    }, 'User socket status');
  })
);

/**
 * @desc      Gửi thông báo đến người dùng
 * @route     POST /api/socket/notify-user/:userId
 * @access    Private (Admin)
 */
router.post(
  '/notify-user/:userId',
  protect,
  authorize('admin', 'staff'),
  asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { title, message, type, data } = req.body;
    
    if (!userId) {
      return next(new ApiError('Vui lòng cung cấp ID người dùng', 400));
    }
    
    if (!title || !message) {
      return next(new ApiError('Vui lòng cung cấp tiêu đề và nội dung thông báo', 400));
    }
    
    // Kiểm tra xem người dùng có online không
    const isOnline = socketService.isUserOnline(userId);
    
    if (!isOnline) {
      return next(new ApiError('Người dùng không online', 400));
    }
    
    // Gửi thông báo
    socketService.notifyUser(userId, {
      type: type || 'general',
      title,
      content: message,
      data: data || {}
    });
    
    return ApiResponse.success(res, {
      userId,
      sent: true
    }, 'Đã gửi thông báo đến người dùng');
  })
);

/**
 * @desc      Gửi thông báo đến tất cả người dùng
 * @route     POST /api/socket/notify-all
 * @access    Private (Admin)
 */
router.post(
  '/notify-all',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res, next) => {
    const { title, message, type, data } = req.body;
    
    if (!title || !message) {
      return next(new ApiError('Vui lòng cung cấp tiêu đề và nội dung thông báo', 400));
    }
    
    // Gửi thông báo
    socketService.notifyAll({
      type: type || 'general',
      title,
      content: message,
      data: data || {}
    });
    
    return ApiResponse.success(res, {
      sent: true,
      clientCount: socketService.io ? socketService.io.engine.clientsCount : 0
    }, 'Đã gửi thông báo đến tất cả người dùng');
  })
);

/**
 * @desc      Gửi thông báo đến một nhóm người dùng
 * @route     POST /api/socket/notify-room
 * @access    Private (Admin)
 */
router.post(
  '/notify-room',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res, next) => {
    const { room, event, data } = req.body;
    
    if (!room || !event || !data) {
      return next(new ApiError('Vui lòng cung cấp đầy đủ thông tin: room, event, data', 400));
    }
    
    // Gửi thông báo
    socketService.notifyRoom(room, event, data);
    
    return ApiResponse.success(res, {
      sent: true,
      room,
      event
    }, 'Đã gửi thông báo đến room');
  })
);

module.exports = router;