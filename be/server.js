// server.js
const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const socketService = require('./services/socket.service');
const config = require('./config/default');

// Kết nối đến database
connectDB();

// Khởi tạo HTTP server
const server = http.createServer(app);

// Khởi tạo Socket.IO
socketService.initialize(server);

// Thiết lập port
const PORT = config.port;

// Start server
server.listen(PORT, () => {
  console.log(`Server đang chạy ở chế độ ${config.nodeEnv} trên port ${PORT}`);
  
  // Log thông tin máy chủ
  console.log(`API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not specified'}`);
  
  if (config.nodeEnv === 'development') {
    console.log(`API Docs: ${process.env.API_URL || `http://localhost:${PORT}`}/api-docs`);
  }
});

// Xử lý lỗi không bắt được
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Ghi log lỗi nhưng không đóng server
});