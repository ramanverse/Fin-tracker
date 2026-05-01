const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'finance_tracker',
});

async function runMigrations() {
  try {
    const initSql = fs.readFileSync(path.join(__dirname, '01_init.sql'), 'utf-8');
    console.log('Running 01_init.sql...');
    await pool.query(initSql);
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
