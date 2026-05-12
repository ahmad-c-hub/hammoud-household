const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function initDB() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR UNIQUE');
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

module.exports = initDB;
