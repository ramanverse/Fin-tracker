const express = require('express');
const { body, validationResult } = require('express-validator');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const validateBudget = [
  body('category_id').notEmpty().withMessage('Category ID is required'),
  body('limit_amount').isNumeric().withMessage('Limit amount must be a number'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    next();
  }
];

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(validateBudget, createBudget);

router.route('/:id')
  .put(body('limit_amount').isNumeric().withMessage('Limit must be a number'), updateBudget)
  .delete(deleteBudget);

module.exports = router;
