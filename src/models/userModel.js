const db = require('../config/db');

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const findByGoogleId = async (googleId) => {
  const result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return result.rows[0];
};

const createUser = async (userData) => {
  const { name, email, password_hash, google_id } = userData;
  const result = await db.query(
    'INSERT INTO users (name, email, password_hash, google_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, password_hash, google_id]
  );
  return result.rows[0];
};

const updateUserProfile = async (id, { name, preferred_currency }) => {
  const result = await db.query(
    'UPDATE users SET name = COALESCE($1, name), preferred_currency = COALESCE($2, preferred_currency) WHERE id = $3 RETURNING *',
    [name, preferred_currency, id]
  );
  return result.rows[0];
};

module.exports = {
  findByEmail,
  findById,
  findByGoogleId,
  createUser,
  updateUserProfile,
};
