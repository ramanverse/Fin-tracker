const { Pool } = require('pg');

// Use External Database URL from Render (supports connections from outside Render network)
// Format: postgresql://user:password@external-host/dbname
const pool = new Pool({
  connectionString: process.env.EXTERNAL_DB_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT FALSE');
    console.log('SUCCESS: is_refund column added to production DB');
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='transactions' AND column_name='is_refund'");
    console.log('Verified column exists:', res.rows.length > 0 ? 'YES' : 'NO');
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await pool.end();
  }
}
fix();
