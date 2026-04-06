const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const inventory = await Inventory.find().sort('category name');
    res.json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private/Admin
router.get('/low-stock', protect, authorize('admin'), async (req, res) => {
  try {
    const inventory = await Inventory.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    }).sort('quantity');
    res.json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Create inventory item
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;