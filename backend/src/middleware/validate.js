const { body, validationResult } = require('express-validator');

// Shared validation rules for user registration
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name can only contain letters, spaces, periods, hyphens, and apostrophes'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('designation')
    .trim()
    .notEmpty().withMessage('Designation is required')
    .isIn([
      'Junior Executive', 'Executive', 'Senior Executive',
      'Manager', 'Senior Manager', 'Director', 'VP', 'SVP', 'CEO/Founder'
    ]).withMessage('Invalid designation'),

  body('salaryBand')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'E', 'F']).withMessage('Invalid salary band'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department must be under 100 characters'),

  body('managerId')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Invalid manager ID'),
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Middleware to check validation results and return errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

module.exports = { registerValidation, loginValidation, handleValidationErrors };
