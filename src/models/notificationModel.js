const db = require('../config/db');

const createNotification = async (userId, message) => {
  const result = await db.query(
    'INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *',
    [userId, message]
  );
  return result.rows[0];
};

module.exports = {
  createNotification,
};
