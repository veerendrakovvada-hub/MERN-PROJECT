const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/reports
// @desc    Get aggregated revenue and order stats summary
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find();

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    const orderCountsByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const itemSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name;
        if (!itemSales[key]) itemSales[key] = { quantity: 0, revenue: 0 };
        itemSales[key].quantity += item.quantity;
        itemSales[key].revenue += item.quantity * item.price;
      });
    });

    const topMenuItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: orders.length,
        orderCountsByStatus,
        topMenuItems,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/sales
// @desc    Get sales report
// @access  Private/Admin
router.get('/sales', protect, authorize('admin'), async (req, res) => {
  try {
    const { range } = req.query;
    let dateFilter = {};
    const now = new Date();

    switch (range) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lte: new Date(now.setHours(23, 59, 59, 999)),
          },
        };
        break;
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { createdAt: { $gte: weekAgo } };
        break;
      }
      case 'month': {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { createdAt: { $gte: monthAgo } };
        break;
      }
      case 'year': {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        dateFilter = { createdAt: { $gte: yearAgo } };
        break;
      }
      default:
        dateFilter = {};
    }

    const orders = await Order.find(dateFilter);
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const dailyData = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + order.total;
    });

    const chartData = Object.entries(dailyData).map(([name, value]) => ({ name, value }));

    res.json({
      success: true,
      summary: { totalRevenue, totalOrders, avgOrderValue },
      data: chartData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/menu
// @desc    Get popular menu items report
// @access  Private/Admin
router.get('/menu', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find().populate('items.menuItem');
    const itemSales = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const itemName = item.name;
        if (!itemSales[itemName]) {
          itemSales[itemName] = { quantity: 0, revenue: 0 };
        }
        itemSales[itemName].quantity += item.quantity;
        itemSales[itemName].revenue += item.quantity * item.price;
      });
    });

    const popularItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    res.json({ success: true, data: popularItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/reservations
// @desc    Get reservations report
// @access  Private/Admin
router.get('/reservations', protect, authorize('admin'), async (req, res) => {
  try {
    const reservations = await Reservation.find();
    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter((r) => r.status === 'confirmed').length;
    const cancelledReservations = reservations.filter((r) => r.status === 'cancelled').length;

    const occasionData = {};
    reservations.forEach((r) => {
      occasionData[r.occasion] = (occasionData[r.occasion] || 0) + 1;
    });

    const chartData = Object.entries(occasionData).map(([name, value]) => ({ name, value }));

    res.json({
      success: true,
      summary: { totalReservations, confirmedReservations, cancelledReservations },
      data: chartData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
