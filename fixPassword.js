require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurants_db');
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Admin1234', salt);

  // Use raw MongoDB driver — bypasses ALL Mongoose hooks completely
  await mongoose.connection.collection('users').updateOne(
    { email: 'admin@restaurant.com' },
    { $set: { password: hash } }
  );

  console.log('Password reset via raw MongoDB (no Mongoose hooks)');

  // Verify
  const doc = await mongoose.connection.collection('users').findOne({ email: 'admin@restaurant.com' });
  const ok = await bcrypt.compare('Admin1234', doc.password);
  console.log('Verification:', ok ? 'PASS' : 'FAIL');
  console.log('\nLogin with: admin@restaurant.com / Admin1234');
  process.exit(0);
}

fix().catch(e => { console.error(e.message); process.exit(1); });
