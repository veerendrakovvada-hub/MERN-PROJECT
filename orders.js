const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Menu = require('../models/Menu');
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Staff can only see their orders, admin sees all
    if (req.user.role !== 'admin') {
      query.customer = req.user.id;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price')
      .populate('table', 'tableNumber')
      .sort('-createdAt');

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.menuItem', 'name price image')
      .populate('table', 'tableNumber location');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (order.customer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, validateOrder, async (req, res) => {
  try {
    const { items, table, orderType, specialInstructions } = req.body;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menuItem} not found` });
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      subtotal,
      tax,
      total,
      table,
      orderType,
      specialInstructions
    });

    // Update table status if dine-in
    if (table && orderType === 'dine-in') {
      await Table.findByIdAndUpdate(table, { status: 'occupied', currentOrder: order._id });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price');

    const io = req.app.get('io');
    if (io) io.emit('newOrder', populatedOrder);

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin or Staff
router.put('/:id/status', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    const io = req.app.get('io');
    if (io) io.emit('orderStatusUpdate', { orderId: order._id, status: order.status });

    // If order is completed, free up the table
    if (status === 'completed' && order.table) {
      await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status
// @access  Private
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;