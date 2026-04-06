const Order = require('../models/Order');
const Menu = require('../models/Menu');
const Table = require('../models/Table');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.customer = req.user.id;
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('items.menuItem', 'name price image')
      .populate('table', 'tableNumber location')
      .sort('-createdAt');
    
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.menuItem', 'name price image description')
      .populate('table', 'tableNumber location capacity');
    
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
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, tableId, orderType, deliveryAddress, specialInstructions } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      
      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `${menuItem.name} is not available` });
      }
      
      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions || ''
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
      table: tableId,
      orderType,
      deliveryAddress,
      specialInstructions,
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    // Update table status if dine-in
    if (tableId && orderType === 'dine-in') {
      await Table.findByIdAndUpdate(tableId, { 
        status: 'occupied', 
        currentOrder: order._id 
      });
    }
    
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price');
    
    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin or Staff
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    await order.save();
    
    // If order is completed, free up the table
    if (status === 'completed' && order.table) {
      await Table.findByIdAndUpdate(order.table, { 
        status: 'available', 
        currentOrder: null 
      });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
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
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check authorization
    if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    // Free up the table if dine-in
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, { 
        status: 'available', 
        currentOrder: null 
      });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};