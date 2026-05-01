const openaiService = require('../services/openaiService');
const transactionModel = require('../models/transactionModel');

const getAnomalies = async (req, res) => {
  try {
    const transactions = await transactionModel.getTransactions(req.user.id);
    if (!transactions || transactions.length === 0) {
      return res.json({ success: true, anomalies: [] });
    }
    
    // limit to last 50 transactions to avoid huge prompts
    const recentTransactions = transactions.slice(0, 50);
    const anomalies = await openaiService.detectAnomalies(recentTransactions);
    
    res.json({ success: true, anomalies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAnomalies,
};
