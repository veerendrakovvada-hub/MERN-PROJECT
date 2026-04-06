const Table = require('../models/Table');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Public
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true }).sort('tableNumber');
    res.json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get available tables
// @route   GET /api/tables/available
// @access  Public
exports.getAvailableTables = async (req, res) => {
  try {
    const { guests } = req.query;
    let query = { status: 'available', isActive: true };
    
    if (guests) {
      query.capacity = { $gte: parseInt(guests) };
    }
    
    const tables = await Table.find(query).sort('capacity');
    res.json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Public
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json({ success: true, data: table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create table
// @route   POST /api/tables
// @access  Private/Admin
exports.createTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;
    
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({ message: 'Table number already exists' });
    }
    
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private/Admin
exports.updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json({ success: true, data: table });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update table status
// @route   PUT /api/tables/:id/status
// @access  Private/Staff
exports.updateTableStatus = async (req, res) => {
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
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json({ success: true, message: 'Table deactivated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};