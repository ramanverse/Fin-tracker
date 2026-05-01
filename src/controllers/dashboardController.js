const db = require('../config/db');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Total income, expenses, net savings (current month)
    const currentMonthStats = await db.query(
      `SELECT 
          SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as total_income,
          SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3 AND t.amount >= 0`,
      [userId, currentMonth, currentYear]
    );

    const income = parseFloat(currentMonthStats.rows[0].total_income) || 0;
    const expenses = parseFloat(currentMonthStats.rows[0].total_expense) || 0;
    const netSavings = income - expenses;

    // 2. Breakdown by category
    const categoryBreakdown = await db.query(
      `SELECT c.name, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND c.type = 'expense' AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
       GROUP BY c.id, c.name`,
      [userId, currentMonth, currentYear]
    );

    // 3. Monthly trend (last 6 months)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const monthlyTrend = await db.query(
      `SELECT 
          EXTRACT(MONTH FROM t.date) as month,
          EXTRACT(YEAR FROM t.date) as year,
          SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as income,
          SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as expense
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.date >= $2
       GROUP BY EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date)
       ORDER BY year ASC, month ASC`,
      [userId, sixMonthsAgo]
    );

    // 4. Budget utilization
    const budgetUtilization = await db.query(
      `SELECT 
          b.category_id,
          c.name as category_name,
          b.limit_amount,
          COALESCE(SUM(t.amount), 0) as total_spent,
          (COALESCE(SUM(t.amount), 0) / b.limit_amount) * 100 as percentage_used
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id 
          AND t.user_id = b.user_id 
          AND EXTRACT(MONTH FROM t.date) = b.month 
          AND EXTRACT(YEAR FROM t.date) = b.year
           AND t.amount >= 0
       WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
       GROUP BY b.category_id, c.name, b.limit_amount`,
      [userId, currentMonth, currentYear]
    );

    res.json({
      success: true,
      data: {
        currentMonth: {
          income,
          expenses,
          netSavings
        },
        categoryBreakdown: categoryBreakdown.rows,
        monthlyTrend: monthlyTrend.rows,
        budgetUtilization: budgetUtilization.rows
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getDashboardData };
