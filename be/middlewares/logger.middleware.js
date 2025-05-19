// middlewares/logger.middleware.js
const winston = require('winston');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục logs tồn tại
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Cấu hình winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'kitchen-utensils-api' },
  transports: [
    // Ghi tất cả log level error và cao hơn vào error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    // Ghi tất cả log vào combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// Nếu không phải trong môi trường production, log vào console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Morgan stream để kết nối với winston
const morganStream = {
  write: (message) => {
    // Xóa ký tự xuống dòng từ message
    const logMessage = message.trim();
    logger.info(logMessage);
  }
};

// Morgan middleware với stream tùy chỉnh
const morganLogger = morgan(
  // Format: method url status response-time ms - user-agent
  ':method :url :status :res[content-length] - :response-time ms - :user-agent',
  { stream: morganStream }
);

// Middleware ghi log request
const requestLogger = (req, res, next) => {
  // Áp dụng morgan
  morganLogger(req, res, (err) => {
    if (err) {
      logger.error('Error logging request:', err);
    }
    next();
  });
};

// Log lỗi
const errorLogger = (err, req, res, next) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'unauthenticated'
  });
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger,
  logger
};