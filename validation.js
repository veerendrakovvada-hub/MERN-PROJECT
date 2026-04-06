const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const validateRegister = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation rules for menu item
const validateMenuItem = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('price')
    .isNumeric().withMessage('Price must be a number')
    .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('category')
    .isIn(['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Soup', 'Salad', 'Special'])
    .withMessage('Invalid category'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation rules for order
const validateOrder = [
  body('items')
    .isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.menuItem')
    .notEmpty().withMessage('Menu item ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('orderType')
    .isIn(['dine-in', 'takeaway', 'delivery']).withMessage('Invalid order type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation rules for reservation
const validateReservation = [
  body('date')
    .isISO8601().withMessage('Invalid date format'),
  body('time')
    .notEmpty().withMessage('Time is required'),
  body('numberOfGuests')
    .isInt({ min: 1, max: 20 }).withMessage('Number of guests must be between 1 and 20'),
  body('customerPhone')
    .notEmpty().withMessage('Phone number is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateRegister,
  validateMenuItem,
  validateOrder,
  validateReservation
};