const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.customer = req.user.id;
    }
    
    const reservations = await Reservation.find(query)
      .populate('customer', 'name email phone')
      .populate('table', 'tableNumber capacity location')
      .sort('-date');
    
    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('table', 'tableNumber capacity location');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check authorization
    if (reservation.customer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private
exports.createReservation = async (req, res) => {
  try {
    const { date, time, numberOfGuests, specialRequests, occasion, customerPhone } = req.body;
    
    // Check if date is in the future
    const reservationDate = new Date(date);
    if (reservationDate < new Date()) {
      return res.status(400).json({ message: 'Reservation date must be in the future' });
    }
    
    // Find available table
    const availableTable = await Table.findOne({ 
      status: 'available', 
      capacity: { $gte: numberOfGuests },
      isActive: true
    });
    
    if (!availableTable) {
      return res.status(400).json({ message: 'No tables available for the selected time' });
    }
    
    const reservation = await Reservation.create({
      customer: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: customerPhone || req.user.phone,
      date,
      time,
      numberOfGuests,
      specialRequests,
      occasion,
      table: availableTable._id,
      status: 'confirmed'
    });
    
    // Update table status
    await Table.findByIdAndUpdate(availableTable._id, { 
      status: 'reserved',
      currentReservation: reservation._id
    });
    
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('customer', 'name email')
      .populate('table', 'tableNumber capacity');
    
    res.status(201).json({ success: true, data: populatedReservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res) => {
  try {
    let reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check authorization
    if (reservation.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Only pending/confirmed reservations can be updated
    if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
      return res.status(400).json({ message: 'Reservation cannot be updated' });
    }
    
    reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check authorization
    if (reservation.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    reservation.status = 'cancelled';
    await reservation.save();
    
    // Free up the table
    if (reservation.table) {
      await Table.findByIdAndUpdate(reservation.table, { 
        status: 'available',
        currentReservation: null
      });
    }
    
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get reservations by date
// @route   GET /api/reservations/date/:date
// @access  Private/Admin
exports.getReservationsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const reservations = await Reservation.find({
      date: { $gte: startDate, $lt: endDate }
    }).populate('table', 'tableNumber capacity');
    
    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};