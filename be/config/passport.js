// config/passport.js
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

// Cấu hình các chiến lược xác thực

// JWT Strategy (Dùng cho xác thực API)
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Tìm người dùng từ payload của JWT
      const user = await User.findById(payload.id).select('-password');
      
      if (!user) {
        return done(null, false);
      }
      
      // Kiểm tra xem token có được tạo sau khi người dùng thay đổi mật khẩu không
      if (user.passwordChangedAt) {
        const passwordChangedTime = parseInt(
          user.passwordChangedAt.getTime() / 1000,
          10
        );
        
        // Nếu token được tạo trước khi thay đổi mật khẩu
        if (payload.iat < passwordChangedTime) {
          return done(null, false);
        }
      }
      
      // Kiểm tra tài khoản bị xóa
      if (user.isDeleted) {
        return done(null, false);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Local Strategy (Đăng nhập bằng username/email và password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Tìm người dùng bằng email
        const user = await User.findOne({
          $or: [{ email: email.toLowerCase() }, { username: email }],
          isDeleted: false
        });
        
        if (!user) {
          return done(null, false, { message: 'Email hoặc mật khẩu không đúng' });
        }
        
        // Kiểm tra mật khẩu
        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Email hoặc mật khẩu không đúng' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra xem người dùng đã tồn tại trong DB chưa
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ],
          isDeleted: false
        });
        
        if (user) {
          // Cập nhật googleId nếu người dùng chưa liên kết tài khoản Google
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save({ validateBeforeSave: false });
          }
          
          return done(null, user);
        }
        
        // Tạo người dùng mới nếu chưa tồn tại
        const newUser = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName || '',
          lastName: profile.name.familyName || '',
          username: `user_${profile.id}`,
          avatar: profile.photos[0].value,
          password: mongoose.Types.ObjectId(), // Tạo mật khẩu ngẫu nhiên
          isEmailVerified: true,
          authProvider: 'google'
        });
        
        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.API_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'photos', 'email', 'name']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra xem người dùng đã tồn tại trong DB chưa
        let user = await User.findOne({
          $or: [
            { facebookId: profile.id },
            { email: profile.emails?.[0].value }
          ],
          isDeleted: false
        });
        
        if (user) {
          // Cập nhật facebookId nếu người dùng chưa liên kết tài khoản Facebook
          if (!user.facebookId) {
            user.facebookId = profile.id;
            await user.save({ validateBeforeSave: false });
          }
          
          return done(null, user);
        }
        
        // Tạo người dùng mới nếu chưa tồn tại
        const newUser = await User.create({
          facebookId: profile.id,
          email: profile.emails?.[0].value || `${profile.id}@facebook.com`,
          firstName: profile.name.givenName || '',
          lastName: profile.name.familyName || '',
          username: `user_${profile.id}`,
          avatar: profile.photos?.[0].value,
          password: mongoose.Types.ObjectId(), // Tạo mật khẩu ngẫu nhiên
          isEmailVerified: profile.emails?.[0].value ? true : false,
          authProvider: 'facebook'
        });
        
        return done(null, newUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Serialize và deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;