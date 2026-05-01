const express = require('express');
const { body, validationResult } = require('express-validator');
const upload = require('../middleware/uploadMiddleware');
const { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, importTransactions } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const validateTransaction = [
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
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
  .get(getTransactions)
  .post(
    upload.single('receipt'),
    [
      body('category_id').notEmpty().withMessage('Category ID is required'),
      body('amount').isNumeric().withMessage('Amount must be a number'),
      body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
      body('date').isISO8601().withMessage('Date is required'),
      validateTransaction[3]
    ],
    createTransaction
  );

router.post('/import', upload.single('statement'), importTransactions);

router.route('/:id')
  .get(getTransaction)
  .put(upload.single('receipt'), validateTransaction, updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
