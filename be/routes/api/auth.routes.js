// routes/api/auth.routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Đăng ký và đăng nhập
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Quản lý tài khoản
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateMe);
router.put('/password', protect, authController.updatePassword);

// Quên & đặt lại mật khẩu
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Xác thực email
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', protect, authController.resendVerification);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback', authController.googleCallback);

// Facebook OAuth
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);
router.get('/facebook/callback', authController.facebookCallback);

// Liên kết tài khoản
router.get('/link/google', protect, authController.linkGoogle);
router.get('/link/facebook', protect, authController.linkFacebook);

module.exports = router;