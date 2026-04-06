const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

console.log("Test server starting...");

app.get('/test', (req, res) => {
    res.json({ message: "Server is working!", time: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
    console.log("Login called with:", req.body);
    
    if (req.body.email === "admin@restaurant.com" && req.body.password === "admin123") {
        console.log("Login SUCCESS");
        return res.json({ 
            success: true, 
            token: "abc123",
            user: { id: 1, name: "Admin", email: "admin@restaurant.com", role: "admin" }
        });
    }
    
    console.log("Login FAILED");
    return res.status(401).json({ success: false, message: "Wrong password" });
});

app.get('/api/menu', (req, res) => {
    console.log("Menu requested");
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: "Pizza", price: 12.99 },
            { id: 2, name: "Burger", price: 9.99 }
        ] 
    });
});

app.listen(5000, () => {
    console.log("=====================================");
    console.log("TEST SERVER RUNNING ON PORT 5000");
    console.log("=====================================");
});