const db = require('../config/db');

const getTransactions = async (userId) => {
  const result = await db.query(
    `SELECT t.*, c.name as category_name, c.type as category_type 
     FROM transactions t 
     LEFT JOIN categories c ON t.category_id = c.id 
     WHERE t.user_id = $1 ORDER BY t.date DESC`, 
    [userId]
  );
  return result.rows;
};

const getTransactionById = async (id, userId) => {
  const result = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
  return result.rows[0];
};

const createTransaction = async (userId, data) => {
  const { category_id, amount, currency, description, date, receipt_url } = data;
  const is_refund = parseFloat(amount) < 0; // auto-compute from negative amount
  const result = await db.query(
    `INSERT INTO transactions (user_id, category_id, amount, currency, description, date, receipt_url, is_refund) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, category_id, amount, currency, description, date, receipt_url, is_refund]
  );
  return result.rows[0];
};

const updateTransaction = async (id, userId, data) => {
  const { category_id, amount, currency, description, date, receipt_url } = data;
  const result = await db.query(
    `UPDATE transactions SET 
       category_id = COALESCE($1, category_id),
       amount = COALESCE($2, amount),
       currency = COALESCE($3, currency),
       description = COALESCE($4, description),
       date = COALESCE($5, date),
       receipt_url = COALESCE($6, receipt_url),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 AND user_id = $8 RETURNING *`,
    [category_id, amount, currency, description, date, receipt_url, id, userId]
  );
  return result.rows[0];
};

const deleteTransaction = async (id, userId) => {
  const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
  return result.rows[0];
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
