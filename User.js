const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: 'customer'
  },
  phone: { type: String, maxlength: 20 },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password only when it is new or changed — never re-hash an existing bcrypt hash
UserSchema.pre('save', async function (next) {
  // Skip if password field wasn't touched
  if (!this.isModified('password')) return next();
  // Skip if it's already a bcrypt hash (starts with $2a$ or $2b$)
  if (this.password && this.password.startsWith('$2')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
