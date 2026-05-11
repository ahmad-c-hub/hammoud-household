const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOnly);

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, role, has_income, can_spend, created_at FROM users WHERE household_id = $1 ORDER BY created_at',
      [req.user.household_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  const { name, username, password, has_income, can_spend, role } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (household_id, name, username, password_hash, role, has_income, can_spend) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, username, role, has_income, can_spend',
      [req.user.household_id, name, username, passwordHash, role || 'member', !!has_income, !!can_spend]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  const { name, has_income, can_spend, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, has_income=$2, can_spend=$3, role=$4 WHERE id=$5 AND household_id=$6 RETURNING id, name, username, role, has_income, can_spend',
      [name, !!has_income, !!can_spend, role, req.params.id, req.user.household_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM users WHERE id=$1 AND household_id=$2',
      [req.params.id, req.user.household_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
