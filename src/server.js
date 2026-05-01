const app = require('./app');
const db = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Run safe startup migrations to ensure schema is up to date
    await db.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT FALSE');
    console.log('Startup migration: is_refund column verified.');
  } catch (err) {
    // Column likely already exists or table doesn't exist yet — safe to ignore
    console.log('Startup migration note:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

startServer();
