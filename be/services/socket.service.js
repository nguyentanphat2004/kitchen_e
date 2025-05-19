// services/socket.service.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const config = require('../config/default');
const notificationService = require('./notification.service');

/**
 * Socket.IO service cho real-time features
 */
class SocketService {
  constructor() {
    this.io = null;
    this.users = {}; // Map userId -> socketId
    this.sockets = {}; // Map socketId -> userId
    this.adminSockets = []; // Array of admin socketIds
  }

  /**
   * Khởi tạo Socket.IO server
   * @param {Object} server - HTTP server từ Express
   */
  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Redis adapter nếu có cấu hình
    if (process.env.REDIS_URL) {
      try {
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();

        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
          this.io.adapter(createAdapter(pubClient, subClient));
          console.log('Socket.IO Redis adapter connected');
        });
      } catch (err) {
        console.error('Redis adapter error:', err);
      }
    }

    // Middleware xác thực
    this.io.use(this.authMiddleware);

    // Thiết lập các events
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.IO server initialized');
    return this.io;
  }

  /**
   * Middleware xác thực với JWT
   */
  authMiddleware = async (socket, next) => {
    try {
      // Token từ query parameters hoặc headers
      const token = socket.handshake.auth.token || 
                    socket.handshake.query.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        // Cho phép kết nối mà không xác thực - sẽ hạn chế quyền sau
        socket.user = null;
        return next();
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Lấy thông tin user
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User không tồn tại'));
      }

      if (user.isDeleted) {
        return next(new Error('Tài khoản đã bị vô hiệu hóa'));
      }

      // Lưu thông tin user vào socket
      socket.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        socket.user = null;
        return next();
      }
      return next(error);
    }
  };

  /**
   * Xử lý khi có kết nối mới
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    console.log(`New socket connection: ${socket.id}`);

    // Nếu đã xác thực, lưu mapping userId -> socketId
    if (socket.user) {
      const userId = socket.user._id.toString();
      
      // Lưu mapping
      this.users[userId] = socket.id;
      this.sockets[socket.id] = userId;

      // Nếu là admin, thêm vào danh sách admins
      if (socket.user.role === 'admin' || socket.user.role === 'staff') {
        this.adminSockets.push(socket.id);
      }

      // Join room riêng cho user
      socket.join(`user:${userId}`);
      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Gửi online status cho user
      this.io.to(`user:${userId}`).emit('connection:status', { connected: true });
      
      // Gửi danh sách thông báo chưa đọc
      this.sendUnreadNotifications(socket, userId);
    }

    // Thiết lập các socket events
    this.setupSocketEvents(socket);

    // Xử lý disconnect
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * Thiết lập các events cho socket
   * @param {Object} socket - Socket instance
   */
  setupSocketEvents(socket) {
    // Cho phép join room 
    socket.on('room:join', (roomName) => {
      // Kiểm tra và sanitize roomName để tránh các phòng không hợp lệ
      if (typeof roomName !== 'string' || !roomName.match(/^[a-zA-Z0-9_\-:]+$/)) {
        return;
      }
  
      // Nếu là admin/staff thì cho phép join bất kỳ room nào
      if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'staff')) {
        socket.join(roomName);
        console.log(`Admin ${socket.user._id} joined room ${roomName}`);
        return;
      }
      
      // Nếu là user thì chỉ cho phép join các public room và room của bản thân
      if (socket.user) {
        const userId = socket.user._id.toString();
        
        if (
          roomName.startsWith('public:') || 
          roomName === `user:${userId}` ||
          roomName.startsWith(`order:${userId}`) ||
          roomName === 'flash-sales' ||
          roomName === 'announcements'
        ) {
          socket.join(roomName);
          console.log(`User ${userId} joined room ${roomName}`);
        }
      } else {
        // Chỉ cho phép join public rooms nếu chưa xác thực
        if (roomName.startsWith('public:') || roomName === 'flash-sales' || roomName === 'announcements') {
          socket.join(roomName);
        }
      }
    });
    
    // Rời khỏi room
    socket.on('room:leave', (roomName) => {
      socket.leave(roomName);
    });

    // Đánh dấu thông báo đã đọc
    socket.on('notification:read', async (notificationId) => {
      if (!socket.user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      try {
        await notificationService.markAsRead(notificationId);
        socket.emit('notification:updated', { id: notificationId, isRead: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });
    
    // Đánh dấu tất cả thông báo đã đọc
    socket.on('notification:read-all', async () => {
      if (!socket.user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      try {
        await notificationService.markAllAsRead(socket.user._id.toString());
        socket.emit('notification:all-read');
        
        // Cập nhật số lượng thông báo chưa đọc
        const unreadCount = await notificationService.getUnreadCount(socket.user._id.toString());
        socket.emit('notification:unread-count', { count: unreadCount });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    // Chat support
    socket.on('chat:message', (data) => {
      if (!socket.user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      const { text, recipientId, recipientType = 'user' } = data;
      
      // Validate message
      if (!text || typeof text !== 'string') {
        socket.emit('error', { message: 'Invalid message' });
        return;
      }
      
      // Tạo message object
      const message = {
        sender: {
          id: socket.user._id,
          name: socket.user.fullName || socket.user.username,
          role: socket.user.role,
          avatar: socket.user.avatar
        },
        text,
        timestamp: new Date()
      };
      
      // Gửi tin nhắn đến recipient
      if (recipientType === 'room') {
        // Gửi đến room
        this.io.to(recipientId).emit('chat:message', message);
      } else if (recipientId) {
        // Gửi đến cá nhân
        this.io.to(`user:${recipientId}`).emit('chat:message', message);
        
        // Gửi thông báo đến tất cả admin/staff nếu không phải admin/staff gửi
        if (socket.user.role !== 'admin' && socket.user.role !== 'staff') {
          this.adminSockets.forEach(adminSocketId => {
            this.io.to(adminSocketId).emit('notification', {
              type: 'new_message',
              title: 'Tin nhắn mới',
              content: `${message.sender.name}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
              data: {
                userId: socket.user._id.toString(),
                userName: message.sender.name
              },
              timestamp: message.timestamp
            });
          });
        }
      }
    });

    // Typing status
    socket.on('chat:typing', (data) => {
      if (!socket.user) return;
      
      const { recipientId, recipientType = 'user', isTyping } = data;
      
      const typingData = {
        userId: socket.user._id,
        userName: socket.user.fullName || socket.user.username,
        isTyping: !!isTyping
      };
      
      if (recipientType === 'room') {
        socket.to(recipientId).emit('chat:typing', typingData);
      } else if (recipientId) {
        socket.to(`user:${recipientId}`).emit('chat:typing', typingData);
      }
    });

    // Đăng ký nhận thông báo
    socket.on('notification:subscribe', (types) => {
      if (!socket.user) return;
      
      if (Array.isArray(types)) {
        types.forEach(type => {
          if (typeof type === 'string') {
            socket.join(`notification:${type}`);
          }
        });
      }
    });
    
    // Hủy đăng ký thông báo
    socket.on('notification:unsubscribe', (types) => {
      if (!socket.user) return;
      
      if (Array.isArray(types)) {
        types.forEach(type => {
          if (typeof type === 'string') {
            socket.leave(`notification:${type}`);
          }
        });
      }
    });
  }

  /**
   * Gửi danh sách thông báo chưa đọc khi người dùng kết nối
   * @param {Object} socket - Socket instance
   * @param {String} userId - ID của người dùng
   */
  async sendUnreadNotifications(socket, userId) {
    try {
      // Lấy thông báo chưa đọc
      const notifications = await Notification.find({
        userId,
        isRead: false,
        isDismissed: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10);
      
      // Lấy số lượng tất cả thông báo chưa đọc
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false,
        isDismissed: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });
      
      // Gửi thông báo chưa đọc
      socket.emit('notification:list', notifications);
      socket.emit('notification:unread-count', { count: unreadCount });
    } catch (error) {
      console.error('Error sending unread notifications:', error);
    }
  }

  /**
   * Xử lý khi người dùng ngắt kết nối
   * @param {Object} socket - Socket instance
   */
  handleDisconnect(socket) {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Nếu socket đã xác thực, cập nhật trạng thái và xóa mapping
    if (this.sockets[socket.id]) {
      const userId = this.sockets[socket.id];
      
      // Xóa mapping
      delete this.users[userId];
      delete this.sockets[socket.id];
      
      // Xóa khỏi adminSockets nếu có
      const adminIndex = this.adminSockets.indexOf(socket.id);
      if (adminIndex !== -1) {
        this.adminSockets.splice(adminIndex, 1);
      }
      
      // Thông báo ngắt kết nối
      this.io.to(`user:${userId}`).emit('connection:status', { connected: false });
      
      console.log(`User ${userId} disconnected`);
    }
  }

  /**
   * Gửi thông báo đến người dùng
   * @param {String} userId - ID người dùng
   * @param {Object} notification - Thông tin thông báo
   */
  notifyUser(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Gửi thông báo đến tất cả người dùng
   * @param {Object} notification - Thông tin thông báo
   */
  notifyAll(notification) {
    this.io.emit('notification:new', notification);
  }

  /**
   * Gửi thông báo flash sale
   * @param {Object} flashSale - Thông tin flash sale
   */
  notifyFlashSale(flashSale) {
    this.io.to('flash-sales').emit('flash-sale:update', {
      id: flashSale._id,
      name: flashSale.name,
      startDate: flashSale.startDate,
      endDate: flashSale.endDate,
      status: flashSale.status,
      bannerImage: flashSale.bannerImage
    });
  }

  /**
   * Gửi cập nhật số lượng còn lại của sản phẩm trong flash sale
   * @param {String} flashSaleId - ID flash sale
   * @param {String} itemId - ID sản phẩm trong flash sale
   * @param {Number} remainingQuantity - Số lượng còn lại
   */
  updateFlashSaleItemQuantity(flashSaleId, itemId, remainingQuantity) {
    this.io.to('flash-sales').emit('flash-sale:item-update', {
      flashSaleId,
      itemId,
      remainingQuantity
    });
  }

  /**
   * Gửi thông báo cập nhật trạng thái đơn hàng
   * @param {Object} order - Đơn hàng
   */
  notifyOrderStatus(order) {
    const roomName = `order:${order.userId}`;
    
    this.io.to(roomName).emit('order:status', {
      orderId: order._id,
      status: order.status,
      updatedAt: order.updatedAt
    });
    
    // Gửi thông báo đến user
    this.io.to(`user:${order.userId}`).emit('notification:new', {
      type: 'order_status',
      title: 'Cập nhật đơn hàng',
      content: `Đơn hàng #${order.orderCode || order._id} đã được cập nhật trạng thái: ${order.status}`,
      data: { orderId: order._id },
      timestamp: new Date()
    });
  }

  /**
   * Gửi thông báo đến một room
   * @param {String} room - Tên room
   * @param {String} event - Tên event
   * @param {Object} data - Dữ liệu gửi
   */
  notifyRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Kiểm tra xem người dùng có online không
   * @param {String} userId - ID người dùng
   * @returns {Boolean} - Trạng thái online
   */
  isUserOnline(userId) {
    return !!this.users[userId];
  }

  /**
   * Lấy tất cả socketIds của một user
   * @param {String} userId - ID người dùng
   * @returns {Array} - Danh sách socketIds
   */
  getUserSockets(userId) {
    const sockets = [];
    for (const [socketId, uId] of Object.entries(this.sockets)) {
      if (uId === userId) {
        sockets.push(socketId);
      }
    }
    return sockets;
  }
  
  /**
   * Lấy số lượng người dùng đang kết nối
   * @returns {Number} - Số lượng người dùng
   */
  getOnlineUsersCount() {
    return Object.keys(this.users).length;
  }
  
  /**
   * Lấy danh sách ID người dùng đang online
   * @returns {Array} - Danh sách ID người dùng
   */
  getOnlineUserIds() {
    return Object.keys(this.users);
  }
  
  /**
   * Lấy số lượng admin đang kết nối
   * @returns {Number} - Số lượng admin
   */
  getOnlineAdminsCount() {
    return this.adminSockets.length;
  }
}

// Singleton instance
const socketService = new SocketService();
module.exports = socketService;