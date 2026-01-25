const Item = require('../models/Item');
const { validationResult } = require('express-validator');

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 100, productType, search, status } = req.query;
    const query = {};

    if (productType) query.productType = productType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { productType: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Item.countDocuments(query);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
};

// Get single item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Attach user ID from authenticated user
    const itemData = {
      ...req.body,
      createdBy: req.userId
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const serverUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
      itemData.images = req.files.map(file => `${serverUrl}/uploads/${file.filename}`);
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Handle the case where images might be filtered/edited and sent back as existing URLs (not implemented in frontend yet but good for robust API)
      // This part needs care: string arrays might come in body if no new files
    }

    const item = new Item(itemData);
    await item.save();

    const populatedItem = await Item.findById(item._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: populatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error.message
    });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if item exists and user has permission
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Allow update if user is admin or item creator
    if (req.user.role !== 'admin' && item.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this item'
      });
    }

    // Handle new file uploads
    let updateData = { ...req.body };

    if (req.files && req.files.length > 0) {
      const serverUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
      const newImages = req.files.map(file => `${serverUrl}/uploads/${file.filename}`);

      // If there are existing images passed as strings (URLs), combine them
      // Note: Multer puts files in req.files, fields in req.body. 
      // Existing images should be sent as 'images' field (array of strings) if reusing logic, 
      // but FormData sends repeated fields. 
      // Simple strategy: Append new images to existing ones OR replace. 
      // Let's Append for now, or respect what frontend sends.

      // Ideally frontend sends 'existingImages' separately or we parse 'images' which might be mixed.
      // For simplicity in this stack: 
      // 1. Files uploaded are NEW.
      // 2. We should fetch existing item to append? Or overwrite? 
      // Requirement says "upload product image".

      // Let's assume replacement or addition. 
      // If we want to ADD to existing:
      // const existingImages = item.images; 
      // updateData.images = [...existingImages, ...newImages];

      // But usually user wants control. Frontend should send everything or we define behavior.
      // Let's go with: If files are uploaded, they are ADDED to whatever 'images' (urls) are in body.

      let finalImages = [];
      if (req.body.images) {
        if (Array.isArray(req.body.images)) finalImages = [...req.body.images];
        else finalImages = [req.body.images]; // single string
      } else {
        // If no images field but we have files, maybe we keep existing? 
        // Safest default for "Update" is usually explicit. 
        // If frontend sends FormData, it must send 'images' for existing ones too if it wants to keep them.
      }

      updateData.images = [...finalImages, ...newImages];
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: error.message
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    // Check if item exists and user has permission
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Allow delete if user is admin or item creator
    if (req.user.role !== 'admin' && item.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item'
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error.message
    });
  }
};

// Update item status only (for publish/unpublish toggle)
exports.updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['published', 'unpublished'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "published" or "unpublished"'
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Allow update if user is admin or item creator
    if (req.user.role !== 'admin' && item.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this item'
      });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Item ${status === 'published' ? 'published' : 'unpublished'} successfully`,
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating item status',
      error: error.message
    });
  }
};
