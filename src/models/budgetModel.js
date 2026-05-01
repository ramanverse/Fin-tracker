const db = require('../config/db');

const checkBudgetForCategory = async (userId, categoryId, date) => {
  const parsedDate = new Date(date);
  const month = parsedDate.getMonth() + 1;
  const year = parsedDate.getFullYear();

  const budgetResult = await db.query(
    'SELECT * FROM budgets WHERE user_id = $1 AND category_id = $2 AND month = $3 AND year = $4',
    [userId, categoryId, month, year]
  );
  
  const budget = budgetResult.rows[0];
  if (!budget) return null;

  const totalSpentResult = await db.query(
    `SELECT SUM(amount) as total 
     FROM transactions 
     WHERE user_id = $1 AND category_id = $2 AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(YEAR FROM date) = $4 AND is_refund = FALSE`,
    [userId, categoryId, month, year]
  );
  
  const totalSpent = parseFloat(totalSpentResult.rows[0].total) || 0;
  
  return {
    budgetLimit: parseFloat(budget.limit_amount),
    totalSpent,
    isExceeded: totalSpent > parseFloat(budget.limit_amount)
  };
};

module.exports = {
  checkBudgetForCategory,
};
