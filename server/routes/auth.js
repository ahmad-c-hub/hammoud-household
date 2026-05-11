const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const DEFAULT_CATEGORIES = [
  'Groceries', 'Car Expenses', 'Utilities', 'Dining Out',
  'Healthcare', 'Education', 'Entertainment', 'Clothing', 'Other',
];

router.get('/setup-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM households');
    res.json({ exists: parseInt(result.rows[0].count) > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register-household', async (req, res) => {
  const { householdName, adminName, username, password } = req.body;
  try {
    const count = await pool.query('SELECT COUNT(*) FROM households');
    if (parseInt(count.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Household already exists' });
    }

    const householdResult = await pool.query(
      'INSERT INTO households (name) VALUES ($1) RETURNING *',
      [householdName]
    );
    const household = householdResult.rows[0];

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (household_id, name, username, password_hash, role, has_income, can_spend) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [household.id, adminName, username, passwordHash, 'admin', true, true]
    );
    const user = userResult.rows[0];

    for (const cat of DEFAULT_CATEGORIES) {
      await pool.query(
        'INSERT INTO categories (household_id, name) VALUES ($1, $2)',
        [household.id, cat]
      );
    }

    const token = jwt.sign(
      { id: user.id, household_id: household.id, role: user.role, has_income: user.has_income, can_spend: user.can_spend, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, has_income: user.has_income, can_spend: user.can_spend } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, household_id: user.household_id, role: user.role, has_income: user.has_income, can_spend: user.can_spend, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, has_income: user.has_income, can_spend: user.can_spend } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
