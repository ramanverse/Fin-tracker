const transactionModel = require('../models/transactionModel');
const budgetModel = require('../models/budgetModel');
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const { sendEmail } = require('../utils/email');
const { convertCurrency } = require('../utils/exchangerate');
const importService = require('../services/importService');
const categoryModel = require('../models/categoryModel');

const checkBudgetAndNotify = async (userId, categoryId, date) => {
  const budgetStatus = await budgetModel.checkBudgetForCategory(userId, categoryId, date);
  
  if (budgetStatus && budgetStatus.isExceeded) {
    const user = await userModel.findById(userId);
    const message = `Budget exceeded! You have spent \${budgetStatus.totalSpent} which is over your limit of \${budgetStatus.budgetLimit}.`;
    
    await notificationModel.createNotification(userId, message);
    await sendEmail(user.email, 'Budget Exceeded Alert', message);
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await transactionModel.getTransactions(req.user.id);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTransaction = async (req, res) => {
  try {
    const transaction = await transactionModel.getTransactionById(req.params.id, req.user.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { category_id, amount, currency, description, date } = req.body;
    let receipt_url = req.file ? `/uploads/\${req.file.filename}` : null;
    
    let actualAmount = parseFloat(amount);
    let is_refund = false;
    
    if (actualAmount < 0) {
      is_refund = true;
      actualAmount = Math.abs(actualAmount);
    }
    
    const user = await userModel.findById(req.user.id);
    const convertedAmount = await convertCurrency(actualAmount, currency, user.preferred_currency);
    
    // Store original amount and currency
    const transaction = await transactionModel.createTransaction(req.user.id, {
      category_id,
      amount: actualAmount,
      currency,
      description,
      date,
      receipt_url,
      is_refund,
    });
    
    // We can append converted amount in response if we want, but DB stores original.
    // Let's trigger budget check
    await checkBudgetAndNotify(req.user.id, category_id, date);
    
    res.status(201).json({ success: true, data: transaction, convertedAmount, preferredCurrency: user.preferred_currency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { category_id, amount, currency, description, date } = req.body;
    let receipt_url = req.file ? `/uploads/\${req.file.filename}` : undefined;
    
    let is_refund = undefined;
    let actualAmount = undefined;
    
    if (amount !== undefined) {
      actualAmount = parseFloat(amount);
      if (actualAmount < 0) {
        is_refund = true;
        actualAmount = Math.abs(actualAmount);
      } else {
        is_refund = false;
      }
    }
    
    const transaction = await transactionModel.updateTransaction(req.params.id, req.user.id, {
      category_id,
      amount: actualAmount,
      currency,
      description,
      date,
      receipt_url,
      is_refund,
    });
    
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    
    // Check budget
    if (category_id || amount !== undefined || date) {
      await checkBudgetAndNotify(req.user.id, transaction.category_id, transaction.date);
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await transactionModel.deleteTransaction(req.params.id, req.user.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const categories = await categoryModel.getCategories(req.user.id);
    const parsedTransactions = await importService.processStatement(req.file.path, req.file.mimetype, categories);
    
    if (!parsedTransactions || parsedTransactions.length === 0) {
      return res.status(400).json({ success: false, error: 'Could not parse any transactions from the file' });
    }

    const existingTransactions = await transactionModel.getTransactions(req.user.id);
    
    const imported = [];
    const duplicates = [];

    for (const txn of parsedTransactions) {
      // Basic duplicate detection: same amount, same date, similar description
      const isDuplicate = existingTransactions.some(ext => {
        return (
          ext.amount === txn.amount &&
          ext.date.toISOString().split('T')[0] === txn.date &&
          ext.description.toLowerCase() === txn.description.toLowerCase()
        );
      });

      if (isDuplicate) {
        duplicates.push(txn);
      } else {
        const created = await transactionModel.createTransaction(req.user.id, {
          category_id: txn.category_id || null,
          amount: txn.amount,
          currency: txn.currency || 'USD',
          description: txn.description,
          date: txn.date,
          receipt_url: null,
          is_refund: txn.is_refund || false,
        });
        
        // Trigger budget check
        if (txn.category_id) {
          await checkBudgetAndNotify(req.user.id, txn.category_id, txn.date);
        }
        imported.push(created);
      }
    }

    res.json({ success: true, imported, duplicates, totalImported: imported.length, totalDuplicates: duplicates.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactions,
};
