const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login:', email, password);
    
    if (email === 'admin@restaurant.com' && password === 'admin123') {
        return res.json({
            success: true,
            token: 'test-token-123',
            user: {
                id: 1,
                name: 'Admin User',
                email: 'admin@restaurant.com',
                role: 'admin'
            }
        });
    }
    
    return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
    });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
    res.json({
        success: true,
        user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@restaurant.com',
            role: 'admin'
        }
    });
});

// Register
app.post('/api/auth/register', (req, res) => {
    res.json({
        success: true,
        token: 'new-token',
        user: {
            id: 2,
            name: req.body.name,
            email: req.body.email,
            role: 'customer'
        }
    });
});

// Menu
app.get('/api/menu', (req, res) => {
    res.json({
        success: true,
        data: [
            { _id: '1', name: 'Margherita Pizza', price: 12.99, category: 'Main Course', isAvailable: true },
            { _id: '2', name: 'Chicken Wings', price: 9.99, category: 'Appetizer', isAvailable: true },
            { _id: '3', name: 'Caesar Salad', price: 7.99, category: 'Salad', isAvailable: true }
        ]
    });
});

// Tables
app.get('/api/tables', (req, res) => {
    res.json({
        success: true,
        data: [
            { _id: '1', tableNumber: 1, capacity: 2, status: 'available' },
            { _id: '2', tableNumber: 2, capacity: 4, status: 'available' },
            { _id: '3', tableNumber: 3, capacity: 4, status: 'occupied' }
        ]
    });
});

// Orders
app.get('/api/orders', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
});

// Reservations
app.get('/api/reservations', (req, res) => {
    res.json({ success: true, data: [], count: 0 });
});

// Inventory
app.get('/api/inventory', (req, res) => {
    res.json({ success: true, data: [] });
});

// Users
app.get('/api/users', (req, res) => {
    res.json({ success: true, data: [] });
});

app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
    console.log(`🔑 Login: admin@restaurant.com / admin123`);
});