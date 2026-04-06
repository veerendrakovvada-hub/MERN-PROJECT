const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');
const { validateReservation } = require('../middleware/validation');

// @route   GET /api/reservations
// @desc    Get all reservations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.customer = req.user.id;
    }

    const reservations = await Reservation.find(query)
      .populate('customer', 'name email')
      .populate('table', 'tableNumber capacity location')
      .sort('-date');

    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reservations
// @desc    Create reservation
// @access  Private
router.post('/', protect, validateReservation, async (req, res) => {
  try {
    const { date, time, numberOfGuests, specialRequests, occasion } = req.body;

    // Check if table is available
    const availableTables = await Table.find({ 
      status: 'available', 
      capacity: { $gte: numberOfGuests },
      isActive: true
    });

    if (availableTables.length === 0) {
      return res.status(400).json({ message: 'No tables available for this time' });
    }

    const reservation = await Reservation.create({
      customer: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.body.customerPhone,
      date,
      time,
      numberOfGuests,
      specialRequests,
      occasion,
      table: availableTables[0]._id,
      status: 'confirmed'
    });

    // Update table status
    await Table.findByIdAndUpdate(availableTables[0]._id, { 
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
});

// @route   PUT /api/reservations/:id/cancel
// @desc    Cancel reservation
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
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
});

module.exports = router;