// app.js - thêm đoạn code sau vào file app.js của bạn
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const passport = require('./config/passport');
const errorHandler = require('./middlewares/error.middleware');
const { requestLogger, errorLogger } = require('./middlewares/logger.middleware');
const { defaultLimiter, authLimiter } = require('./middlewares/limiter.middleware');
const path = require('path');

// Khởi tạo app
const app = express();

// Middleware ghi log request
app.use(requestLogger);

// Nén phản hồi
app.use(compression());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Session - cần thiết cho Passport OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// Khởi tạo Passport
app.use(passport.initialize());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

// Security headers
app.use(helmet());

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Prevent http param pollution
app.use(hpp());

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting cho toàn bộ API
app.use('/api/', defaultLimiter);

// Rate limiting chặt chẽ hơn cho các route xác thực
app.use('/api/auth/', authLimiter);

// Routes
app.use('/api/auth', require('./routes/api/auth.routes'));
app.use('/api/products', require('./routes/api/products.routes'));
// Thêm các route khác tại đây

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Middleware ghi log lỗi
app.use(errorLogger);

// Error handler
app.use(errorHandler);

module.exports = app;