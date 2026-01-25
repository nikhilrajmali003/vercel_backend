const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const otpController = require('../controllers/otpController');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validator');

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .notEmpty().withMessage('Password is required when not using OTP'),
  body('otp')
    .optional()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .matches(/^\d+$/).withMessage('OTP must contain only digits')
];

const otpRequestValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('purpose')
    .optional()
    .isIn(['login', 'register', 'password-reset', 'email-verification'])
    .withMessage('Purpose must be one of: login, register, password-reset, email-verification')
];

const otpVerifyValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .matches(/^\d+$/).withMessage('OTP must contain only digits'),
  body('purpose')
    .optional()
    .isIn(['login', 'register', 'password-reset', 'email-verification'])
    .withMessage('Purpose must be one of: login, register, password-reset, email-verification')
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
];

// Routes
// Public routes
router.post('/register', registerValidation, validate, userController.register);
router.post('/login', loginValidation, validate, userController.login);

// OTP routes
router.post('/otp/request', otpRequestValidation, validate, otpController.requestOTP);
router.post('/otp/verify', otpVerifyValidation, validate, otpController.verifyOTP);
router.post('/otp/resend', otpRequestValidation, validate, otpController.resendOTP);

// Protected routes
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, updateUserValidation, validate, userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
