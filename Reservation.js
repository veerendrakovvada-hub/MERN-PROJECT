const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  reservationNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  specialRequests: String,
  occasion: {
    type: String,
    enum: ['Birthday', 'Anniversary', 'Business', 'Other', 'None'],
    default: 'None'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate reservation number before saving
ReservationSchema.pre('save', async function(next) {
  if (!this.reservationNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = await mongoose.model('Reservation').countDocuments();
    this.reservationNumber = `RES-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Reservation', ReservationSchema);