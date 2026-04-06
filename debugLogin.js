require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurants_db');
  const User = require('./models/User');

  console.log('--- BEFORE login simulation ---');
  let admin = await User.findOne({ email: 'admin@restaurant.com' }).select('+password');
  console.log('Hash:', admin.password?.substring(0, 20));
  let match = await bcrypt.compare('Admin1234', admin.password);
  console.log('Password matches:', match);

  // Simulate exactly what login does
  console.log('\n--- Simulating login endpoint ---');
  const user = await User.findOne({ email: 'admin@restaurant.com' }).select('+password');
  const isMatch = await user.matchPassword('Admin1234');
  console.log('matchPassword result:', isMatch);

  console.log('\n--- AFTER login simulation ---');
  admin = await User.findOne({ email: 'admin@restaurant.com' }).select('+password');
  console.log('Hash:', admin.password?.substring(0, 20));
  match = await bcrypt.compare('Admin1234', admin.password);
  console.log('Password still matches:', match);

  // Now simulate getMe (what happens after login when dashboard loads)
  console.log('\n--- Simulating getMe (dashboard load) ---');
  const me = await User.findById(user._id).select('-password');
  console.log('getMe user:', me.email, me.role);

  console.log('\n--- AFTER getMe ---');
  admin = await User.findOne({ email: 'admin@restaurant.com' }).select('+password');
  match = await bcrypt.compare('Admin1234', admin.password);
  console.log('Password still matches:', match);

  process.exit(0);
}

debug().catch(e => { console.error(e.message); process.exit(1); });
