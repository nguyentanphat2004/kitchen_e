// models/FaceAuthData.js
const mongoose = require('mongoose');

const FaceAuthDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    faceEmbedding: {
      type: [Number],
      required: [true, 'Face embedding is required'],
      description: 'The facial recognition vector (128-dimensional float array)'
    },
    faceCapture: {
      type: String,
      description: 'Base64 encoded face image for registration (optional)'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    authenticationHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now
        },
        success: Boolean,
        similarity: Number,
        ipAddress: String,
        deviceInfo: String
      }
    ],
    failedAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Ensure face embedding is properly formatted
FaceAuthDataSchema.pre('save', function(next) {
  // Check if faceEmbedding is an array of proper length (128 dimensions)
  if (!Array.isArray(this.faceEmbedding) || this.faceEmbedding.length !== 128) {
    return next(new Error('Face embedding must be a 128-dimensional array'));
  }
  
  // Check if values are valid numbers
  for (const value of this.faceEmbedding) {
    if (typeof value !== 'number' || isNaN(value)) {
      return next(new Error('Face embedding contains invalid values'));
    }
  }
  
  // Update lastUpdated timestamp
  this.lastUpdated = new Date();
  
  next();
});

// Method to record authentication attempt
FaceAuthDataSchema.methods.recordAuthAttempt = async function(success, similarity, ipAddress = '', deviceInfo = '') {
  // Add to authentication history
  this.authenticationHistory.push({
    timestamp: new Date(),
    success,
    similarity,
    ipAddress,
    deviceInfo
  });
  
  // Keep only the last 50 entries in history
  if (this.authenticationHistory.length > 50) {
    this.authenticationHistory = this.authenticationHistory.slice(-50);
  }
  
  // Update failed attempts counter
  if (!success) {
    this.failedAttempts += 1;
    
    // Lock after 5 consecutive failed attempts
    if (this.failedAttempts >= 5) {
      // Lock for 15 minutes
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15);
      this.lockedUntil = lockTime;
    }
  } else {
    // Reset failed attempts on successful login
    this.failedAttempts = 0;
    this.lockedUntil = null;
  }
  
  return this.save();
};

// Method to check if authentication is locked
FaceAuthDataSchema.methods.isLocked = function() {
  if (!this.lockedUntil) return false;
  
  const now = new Date();
  if (now < this.lockedUntil) {
    return true;
  }
  
  // If lock has expired, reset it
  this.lockedUntil = null;
  this.failedAttempts = 0;
  return false;
};

// Method to update face embedding
FaceAuthDataSchema.methods.updateFaceEmbedding = async function(newEmbedding, faceCapture = null) {
  this.faceEmbedding = newEmbedding;
  
  if (faceCapture) {
    this.faceCapture = faceCapture;
  }
  
  this.lastUpdated = new Date();
  this.failedAttempts = 0;
  this.lockedUntil = null;
  
  return this.save();
};

// Static method to check if a user has face auth enabled
FaceAuthDataSchema.statics.hasFaceAuth = async function(userId) {
  const faceAuthData = await this.findOne({ userId, isActive: true });
  return !!faceAuthData;
};

// Method to deactivate face authentication
FaceAuthDataSchema.methods.deactivate = async function() {
  this.isActive = false;
  
  // Update user record to reflect face auth status
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.userId, { hasFaceAuth: false });
  } catch (error) {
    console.error('Failed to update user face auth status:', error);
  }
  
  return this.save();
};

// Index for faster lookups
FaceAuthDataSchema.index({ userId: 1 });

module.exports = mongoose.model('FaceAuthData', FaceAuthDataSchema);