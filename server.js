const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Sample data
const menuItems = [
  { _id: '1', name: 'Margherita Pizza', price: 12.99, category: 'Main Course', description: 'Fresh mozzarella, tomato sauce, basil', isAvailable: true },
  { _id: '2', name: 'Chicken Wings', price: 9.99, category: 'Appetizer', description: 'Spicy buffalo wings with ranch', isAvailable: true },
  { _id: '3', name: 'Caesar Salad', price: 7.99, category: 'Salad', description: 'Romaine lettuce, parmesan, croutons', isAvailable: true },
  { _id: '4', name: 'Spaghetti Carbonara', price: 14.99, category: 'Main Course', description: 'Pasta with eggs, cheese, pancetta', isAvailable: true }
];

const tables = [
  { _id: '1', tableNumber: 1, capacity: 2, status: 'available', location: 'Window' },
  { _id: '2', tableNumber: 2, capacity: 4, status: 'available', location: 'Indoor' },
  { _id: '3', tableNumber: 3, capacity: 4, status: 'occupied', location: 'Indoor' },
  { _id: '4', tableNumber: 4, capacity: 6, status: 'available', location: 'Private' }
];

let orders = [
  { _id: '1', orderNumber: 'ORD-001', table: { tableNumber: 3 }, items: [{ name: 'Pizza', quantity: 2, price: 12.99 }], total: 25.98, status: 'preparing', createdAt: new Date() }
];

let reservations = [
  { _id: '1', customerName: 'John Doe', customerEmail: 'john@example.com', customerPhone: '1234567890', date: new Date(), time: '7:00 PM', numberOfGuests: 4, status: 'confirmed', table: { tableNumber: 2 } }
];

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@restaurant.com' && password === 'Admin1234') {
    res.json({
      success: true,
      token: 'fake-token-' + Date.now(),
      user: { id: 1, name: 'Admin User', email: 'admin@restaurant.com', role: 'admin' }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Auth check
app.get('/api/auth/me', (req, res) => {
  res.json({ success: true, user: { id: 1, name: 'Admin User', email: 'admin@restaurant.com', role: 'admin' } });
});

// Menu
app.get('/api/menu', (req, res) => res.json({ success: true, data: menuItems }));
app.post('/api/menu', (req, res) => {
  const newItem = { _id: Date.now().toString(), ...req.body };
  menuItems.push(newItem);
  res.json({ success: true, data: newItem });
});
app.put('/api/menu/:id', (req, res) => {
  const index = menuItems.findIndex(i => i._id === req.params.id);
  if (index !== -1) {
    menuItems[index] = { ...menuItems[index], ...req.body };
    res.json({ success: true, data: menuItems[index] });
  } else {
    res.status(404).json({ success: false });
  }
});
app.delete('/api/menu/:id', (req, res) => {
  const index = menuItems.findIndex(i => i._id === req.params.id);
  if (index !== -1) {
    menuItems.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

// Tables
app.get('/api/tables', (req, res) => res.json({ success: true, data: tables }));
app.put('/api/tables/:id/status', (req, res) => {
  const table = tables.find(t => t._id === req.params.id);
  if (table) {
    table.status = req.body.status;
    res.json({ success: true, data: table });
  } else {
    res.status(404).json({ success: false });
  }
});

// Orders
app.get('/api/orders', (req, res) => res.json({ success: true, data: orders }));
app.put('/api/orders/:id/status', (req, res) => {
  const order = orders.find(o => o._id === req.params.id);
  if (order) {
    order.status = req.body.status;
    res.json({ success: true, data: order });
  } else {
    res.status(404).json({ success: false });
  }
});

// Reservations
app.get('/api/reservations', (req, res) => res.json({ success: true, data: reservations }));
app.post('/api/reservations', (req, res) => {
  const newRes = { _id: Date.now().toString(), ...req.body, status: 'confirmed' };
  reservations.push(newRes);
  res.json({ success: true, data: newRes });
});
app.put('/api/reservations/:id/cancel', (req, res) => {
  const reservation = reservations.find(r => r._id === req.params.id);
  if (reservation) {
    reservation.status = 'cancelled';
    res.json({ success: true, data: reservation });
  } else {
    res.status(404).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`🔑 Login: admin@restaurant.com / Admin1234\n`);
});