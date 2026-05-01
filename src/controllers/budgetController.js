const db = require('../config/db');

const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = 'SELECT * FROM budgets WHERE user_id = $1';
    const params = [req.user.id];
    
    if (month && year) {
      query += ' AND month = $2 AND year = $3';
      params.push(month, year);
    }
    
    const result = await db.query(query, params);
    
    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(result.rows.map(async (b) => {
      const spendingResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE user_id = $1 AND category_id = $2 AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(YEAR FROM date) = $4 AND is_refund = FALSE`,
        [req.user.id, b.category_id, b.month, b.year]
      );
      
      const totalSpent = parseFloat(spendingResult.rows[0].total);
      return {
        ...b,
        total_spent: totalSpent,
        percentage_used: (totalSpent / parseFloat(b.limit_amount)) * 100
      };
    }));
    
    res.json({ success: true, data: budgetsWithSpending });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createBudget = async (req, res) => {
  try {
    const { category_id, limit_amount, month, year } = req.body;
    
    const result = await db.query(
      'INSERT INTO budgets (user_id, category_id, limit_amount, month, year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, category_id, limit_amount, month, year]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { limit_amount } = req.body;
    
    const result = await db.query(
      'UPDATE budgets SET limit_amount = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [limit_amount, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Budget not found' });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Budget not found' });
    
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
};
