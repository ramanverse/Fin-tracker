const db = require('../config/db');

const getCategoriesByUser = async (userId) => {
  const result = await db.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
};

const getCategoryById = async (id, userId) => {
  const result = await db.query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
  return result.rows[0];
};

const createCategory = async (userId, { name, type }) => {
  const result = await db.query(
    'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, type]
  );
  return result.rows[0];
};

const updateCategory = async (id, userId, { name, type }) => {
  const result = await db.query(
    'UPDATE categories SET name = COALESCE($1, name), type = COALESCE($2, type) WHERE id = $3 AND user_id = $4 RETURNING *',
    [name, type, id, userId]
  );
  return result.rows[0];
};

const deleteCategory = async (id, userId) => {
  const result = await db.query('DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
  return result.rows[0];
};

const getUncategorizedCategory = async (userId, type) => {
  // First try to find "Uncategorized" for this user and type
  let result = await db.query(
    'SELECT * FROM categories WHERE user_id = $1 AND name = $2 AND type = $3',
    [userId, 'Uncategorized', type]
  );
  
  if (result.rows.length === 0) {
    // Create it if it doesn't exist
    result = await db.query(
      'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [userId, 'Uncategorized', type]
    );
  }
  
  return result.rows[0];
};

const countTransactionsForCategory = async (categoryId) => {
  const result = await db.query('SELECT COUNT(*) FROM transactions WHERE category_id = $1', [categoryId]);
  return parseInt(result.rows[0].count, 10);
};

const reassignTransactions = async (oldCategoryId, newCategoryId) => {
  await db.query('UPDATE transactions SET category_id = $2 WHERE category_id = $1', [oldCategoryId, newCategoryId]);
};

module.exports = {
  getCategoriesByUser,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getUncategorizedCategory,
  countTransactionsForCategory,
  reassignTransactions,
};
