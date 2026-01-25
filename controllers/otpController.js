const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');
const { validationResult } = require('express-validator');
const otpService = require('../services/otpService');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP
exports.requestOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, purpose = 'login' } = req.body;

    // Validate purpose
    const validPurposes = ['login', 'register', 'password-reset', 'email-verification'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose. Must be one of: login, register, password-reset, email-verification'
      });
    }

    // Check if user exists (for login and password-reset)
    if (purpose === 'login' || purpose === 'password-reset') {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email'
        });
      }

      if (!user.isActive && purpose === 'login') {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }
    }

    // Check if user already exists (for register)
    if (purpose === 'register') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }
    }

    // Check for recent OTP requests (rate limiting)
    const recentOTP = await OTP.findOne({
      email,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
      createdAt: { $gte: new Date(Date.now() - 60000) } // Within last minute
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another OTP',
        retryAfter: Math.ceil((recentOTP.createdAt.getTime() + 60000 - Date.now()) / 1000)
      });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused OTPs for this email and purpose
    await OTP.updateMany(
      { email, purpose, isUsed: false },
      { isUsed: true }
    );

    const otpDoc = new OTP({
      email,
      otp,
      purpose,
      expiresAt
    });

    await otpDoc.save();

    // Send OTP email
    try {
      const emailResult = await sendOTPEmail(email, otp, purpose);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your email',
        data: {
          email,
          purpose,
          expiresIn: 600, // 10 minutes in seconds
          // Include OTP in development mode for testing
          ...(process.env.NODE_ENV === 'development' && { otp })
        }
      });
    } catch (emailError) {
      // Even if email fails, OTP is saved (for development/testing)
      console.error('Email sending failed:', emailError);

      res.status(200).json({
        success: true,
        message: 'OTP generated (email service may not be configured)',
        data: {
          email,
          purpose,
          expiresIn: 600,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
          warning: 'Email service error. Check server logs.'
        }
      });
    }
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating OTP',
      error: error.message
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, otp, purpose = 'login' } = req.body;

    const verificationResult = await otpService.verifyOTP(email, otp, purpose);

    if (!verificationResult.success) {
      return res.status(400).json(verificationResult);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email,
        purpose,
        verified: true
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, purpose = 'login' } = req.body;

    // This is essentially the same as requestOTP
    // We'll reuse the requestOTP logic
    return exports.requestOTP(req, res);
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};
