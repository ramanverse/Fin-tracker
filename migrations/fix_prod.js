require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false
});

async function fix() {
  try {
    const res = await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT FALSE');
    console.log('SUCCESS: is_refund column added to production DB');
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await pool.end();
  }
}
fix();
