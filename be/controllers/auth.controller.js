// controllers/auth.controller.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/async.middleware');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Kiểm tra xem email đã tồn tại chưa
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    if (existingUser.email === email) {
      return next(new ApiError('Email đã được sử dụng', 400));
    } else {
      return next(new ApiError('Tên đăng nhập đã được sử dụng', 400));
    }
  }

  // Tạo người dùng mới
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName
  });

  // Tạo token xác thực email
  const emailToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Tạo URL xác thực
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;

  // Gửi email xác thực
  try {
    console.log('🚀 Bắt đầu gửi email xác thực');
  
    await sendEmail({
      to: user.email,
      subject: 'Xác thực tài khoản',
      template: 'email-verification',
      context: {
        name: user.firstName || user.username,
        verifyUrl
      }
    });
  
    console.log('✅ Gửi email xong, chuẩn bị gửi JWT');
  
    sendTokenResponse(user, 201, res); // Có thể lỗi tại đây
  
    console.log('✅ Gửi token xong'); // Nếu không thấy log này → lỗi nằm trong sendTokenResponse
  } catch (error) {
    
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ApiError('Không thể gửi email xác thực', 500));
  }
});

/**
 * @desc    Đăng nhập người dùng
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(new ApiError('Lỗi đăng nhập', 500));
    }

    if (!user) {
      return next(new ApiError(info.message || 'Email hoặc mật khẩu không đúng', 401));
    }

    // Cập nhật thời gian đăng nhập cuối
    user.lastLogin = Date.now();
    user.save({ validateBeforeSave: false });

    // Gửi token JWT
    sendTokenResponse(user, 200, res);
  })(req, res, next);
};

/**
 * @desc    Đăng xuất người dùng (xóa cookie ở phía client)
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  return ApiResponse.success(res, null, 'Đăng xuất thành công');
});

/**
 * @desc    Lấy thông tin người dùng hiện tại
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  return ApiResponse.success(res, { user });
});

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateMe = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phoneNumber } = req.body;

  // Chỉ cho phép cập nhật một số trường nhất định
  const fieldsToUpdate = {
    firstName,
    lastName,
    phoneNumber
  };

  // Lọc bỏ các trường undefined
  Object.keys(fieldsToUpdate).forEach(
    key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  return ApiResponse.success(res, { user });
});

/**
 * @desc    Thay đổi mật khẩu
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!currentPassword || !newPassword) {
    return next(new ApiError('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới', 400));
  }

  // Lấy thông tin người dùng kèm mật khẩu
  const user = await User.findById(req.user.id).select('+password');

  // Kiểm tra mật khẩu hiện tại
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ApiError('Mật khẩu hiện tại không đúng', 401));
  }

  // Cập nhật mật khẩu mới
  user.password = newPassword;
  await user.save();

  // Gửi token JWT mới
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Quên mật khẩu - gửi email đặt lại
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError('Vui lòng nhập địa chỉ email', 400));
  }

  // Tìm người dùng theo email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ApiError('Không tìm thấy tài khoản với email này', 404));
  }

  // Tạo token đặt lại mật khẩu
  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Tạo URL đặt lại mật khẩu
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Gửi email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Đặt lại mật khẩu',
      template: 'reset-password',
      context: {
        name: user.firstName || user.username,
        resetUrl,
        expireTime: '10 phút'
      }
    });

    return ApiResponse.success(res, null, 'Email đặt lại mật khẩu đã được gửi');
  } catch (error) {
    // Nếu có lỗi khi gửi email, xóa token và báo lỗi
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ApiError('Không thể gửi email đặt lại mật khẩu', 500));
  }
});

/**
 * @desc    Đặt lại mật khẩu
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return next(new ApiError('Thiếu thông tin bắt buộc', 400));
  }

  // Mã hóa token để so sánh với token trong DB
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Tìm người dùng theo token và kiểm tra hạn của token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ApiError('Token không hợp lệ hoặc đã hết hạn', 400));
  }

  // Đặt mật khẩu mới
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return ApiResponse.success(res, null, 'Đặt lại mật khẩu thành công');
});

/**
 * @desc    Xác thực email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new ApiError('Thiếu token xác thực', 400));
  }

  // Mã hóa token để so sánh với token trong DB
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Tìm người dùng theo token và kiểm tra hạn của token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ApiError('Token không hợp lệ hoặc đã hết hạn', 400));
  }

  // Xác thực email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return ApiResponse.success(res, null, 'Xác thực email thành công');
});

/**
 * @desc    Gửi lại email xác thực
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
exports.resendVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isEmailVerified) {
    return next(new ApiError('Email của bạn đã được xác thực', 400));
  }

  // Tạo token xác thực mới
  const emailToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Tạo URL xác thực
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;

  // Gửi email
  try {
    console.log('🚀 Bắt đầu gửi email xác thực');
  
    await sendEmail({
      to: user.email,
      subject: 'Xác thực tài khoản',
      template: 'email-verification',
      context: {
        name: user.firstName || user.username,
        verifyUrl
      }
    });
  
    console.log('✅ Gửi email xong, chuẩn bị gửi JWT');
  
    sendTokenResponse(user, 201, res);
  
    console.log('✅ Gửi token xong');
  } catch (error) {
    console.error('❌ Lỗi chi tiết:', error);
    
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });
  
    return next(new ApiError('Lỗi xử lý sau khi gửi email: ' + error.message, 500));
  }
});

/**
 * @desc    Xác thực Google OAuth - callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }

    // Tạo JWT
    const token = user.getSignedJwtToken();

    // Redirect về frontend kèm token
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  })(req, res, next);
};

/**
 * @desc    Xác thực Facebook OAuth - callback
 * @route   GET /api/auth/facebook/callback
 * @access  Public
 */
exports.facebookCallback = (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`);
    }

    // Tạo JWT
    const token = user.getSignedJwtToken();

    // Redirect về frontend kèm token
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  })(req, res, next);
};

/**
 * @desc    Liên kết tài khoản Google
 * @route   GET /api/auth/link/google
 * @access  Private
 */
exports.linkGoogle = (req, res, next) => {
  req.session.linkProvider = true;
  req.session.userId = req.user.id;
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

/**
 * @desc    Liên kết tài khoản Facebook
 * @route   GET /api/auth/link/facebook
 * @access  Private
 */
exports.linkFacebook = (req, res, next) => {
  req.session.linkProvider = true;
  req.session.userId = req.user.id;
  
  passport.authenticate('facebook', {
    scope: ['email', 'public_profile']
  })(req, res, next);
};

/**
 * Helper: Gửi token JWT trong response
 */
const sendTokenResponse = (user, statusCode, res) => {
  try {
    // Tạo token
    const token = user.getSignedJwtToken();
    console.log('✅ JWT token đã được tạo');

    // Thiết lập cookie
    const cookieExpire = process.env.JWT_COOKIE_EXPIRE || 30; // Giá trị mặc định nếu không có biến môi trường
    const options = {
      expires: new Date(
        Date.now() + cookieExpire * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    // Thêm secure=true trong môi trường production
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    console.log('✅ Chuẩn bị gửi response');
    res
      .status(statusCode)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar
        }
      });
    console.log('✅ Gửi token xong');
  } catch (error) {
    console.error('❌ Lỗi trong sendTokenResponse:', error);
    throw error; // Ném lại lỗi để catch bên ngoài xử lý
  }
};