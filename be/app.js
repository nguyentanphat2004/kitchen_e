// app.js - thêm đoạn code sau vào file app.js của bạn
const express = require('express');
require('dotenv').config();
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
const { attachSocketService } = require('./middlewares/socket.middleware');
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
app.use('/api/bundles', require('./routes/api/bundles.routes'));
app.use('/api/categories', require('./routes/api/categories.routes')); // Thêm route categories
app.use('/api/recipes', require('./routes/api/recipes.routes'));
app.use('/api/cart', require('./routes/api/carts.routes')); // Thêm route cart
app.use('/api/orders', require('./routes/api/orders.routes')); // Thêm route orders
app.use('/api/payments', require('./routes/api/payments.routes')); // Thêm route payments
app.use('/api/wishlist', require('./routes/api/wishlist.routes'));
app.use('/api/users', require('./routes/api/users.routes'));
app.use('/api/flash-sales', require('./routes/api/flash-sales.routes'));
app.use('/api/reviews', require('./routes/api/reviews.routes'));
app.use('/api/vouchers', require('./routes/api/vouchers.routes'));
app.use('/api/notifications', require('./routes/api/notifications.routes'));
app.use('/api/socket', require('./routes/api/socket.routes')); // Thêm route wishlist
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