const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/tables
// @desc    Get all tables
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort('tableNumber');
    res.json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tables
// @desc    Create table
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tables/:id/status
// @desc    Update table status
// @access  Private/Staff
router.put('/:id/status', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json({ success: true, data: table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;