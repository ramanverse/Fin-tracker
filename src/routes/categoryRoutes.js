const express = require('express');
const { body, validationResult } = require('express-validator');
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const validateCategory = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    next();
  }
];

router.use(protect); // All category routes are protected

router.route('/')
  .get(getCategories)
  .post([
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    validateCategory[2]
  ], createCategory);

router.route('/:id')
  .get(getCategory)
  .put(validateCategory, updateCategory)
  .delete(deleteCategory);

module.exports = router;
