// routes/api/notifications.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');
const { 
  getUserNotifications,
  getNotification,
  markAsRead, 
  markAllAsRead,
  dismissNotification,
  deleteNotification, 
  deleteReadNotifications,
  deleteAllNotifications,
  createBulkNotifications,
  createFromTemplate,
  getUnreadCount
} = require('../../controllers/notification.controller');

// @route   /api/notifications

// Bảo vệ tất cả các routes
router.use(protect);

// Route lấy danh sách thông báo
router.get('/', getUserNotifications);

// Route lấy chi tiết thông báo
router.get('/:id', getNotification);

// Route lấy số lượng thông báo chưa đọc
router.get('/unread-count', getUnreadCount);

// Route đánh dấu đã đọc
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

// Route đánh dấu đã bỏ qua
router.put('/:id/dismiss', dismissNotification);

// Route xóa thông báo
router.delete('/:id', deleteNotification);
router.delete('/read', deleteReadNotifications);
router.delete('/', deleteAllNotifications);

// Admin routes
router.post('/bulk', authorize('admin'), createBulkNotifications);
router.post('/template', authorize('admin'), createFromTemplate);

module.exports = router;