const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  productType: {
    type: String,
    required: [true, 'Product type is required'],
    enum: ['Foods', 'Electronics', 'Clothes', 'Beauty Products', 'Others'],
    trim: true
  },
  quantityStock: {
    type: Number,
    required: [true, 'Quantity stock is required'],
    min: [0, 'Quantity stock cannot be negative']
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  brandName: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  images: [{
    type: String,
    default: []
  }],
  exchangeEligibility: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['published', 'unpublished'],
    default: 'unpublished'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
itemSchema.index({ productName: 'text', description: 'text' });
itemSchema.index({ productType: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ status: 1 });

module.exports = mongoose.model('Item', itemSchema);
