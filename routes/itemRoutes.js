const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { body } = require('express-validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validator');
const upload = require('../middleware/upload');

// Validation rules
const itemValidation = [
  body('productName')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  body('productType')
    .notEmpty().withMessage('Product type is required')
    .isIn(['Foods', 'Electronics', 'Clothes', 'Beauty Products', 'Others']).withMessage('Invalid product type'),
  body('quantityStock')
    .notEmpty().withMessage('Quantity stock is required')
    .isInt({ min: 0 }).withMessage('Quantity stock must be a positive integer'),
  body('mrp')
    .notEmpty().withMessage('MRP is required')
    .isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
  body('sellingPrice')
    .notEmpty().withMessage('Selling price is required')
    .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('brandName')
    .trim()
    .notEmpty().withMessage('Brand name is required')
    .isLength({ max: 100 }).withMessage('Brand name cannot exceed 100 characters'),
  body('exchangeEligibility')
    .optional()
    .isIn(['Yes', 'No']).withMessage('Invalid exchange eligibility'),
  body('status')
    .optional()
    .isIn(['published', 'unpublished']).withMessage('Invalid status'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
];

// Routes
// Public routes (optional auth for filtering by user)
router.get('/', optionalAuth, itemController.getAllItems);
router.get('/:id', optionalAuth, itemController.getItemById);

// Protected routes (require authentication)
router.post('/', authenticate, upload.array('images', 5), itemValidation, validate, itemController.createItem);
router.put('/:id', authenticate, upload.array('images', 5), itemValidation, validate, itemController.updateItem);
router.patch('/:id/status', authenticate, itemController.updateItemStatus);
router.delete('/:id', authenticate, itemController.deleteItem);

module.exports = router;
