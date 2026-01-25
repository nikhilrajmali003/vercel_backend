const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: 6
  },
  purpose: {
    type: String,
    enum: ['login', 'register', 'password-reset', 'email-verification'],
    default: 'login'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired OTPs
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum verification attempts
  }
}, {
  timestamps: true
});

// Index for faster lookups
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);
