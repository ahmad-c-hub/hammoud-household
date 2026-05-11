const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.post('/', async (req, res) => {
  if (!req.user.has_income) return res.status(403).json({ error: 'Not authorized to log income' });
  const { amount, month } = req.body;
  const amountCents = Math.round(parseFloat(amount) * 100);
  try {
    const result = await pool.query(
      'INSERT INTO income_entries (user_id, household_id, amount_cents, month) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, req.user.household_id, amountCents, month]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Income already entered for this month' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { month, user_id } = req.query;
  let query = `
    SELECT ie.*, u.name AS user_name
    FROM income_entries ie
    JOIN users u ON u.id = ie.user_id
    WHERE ie.household_id = $1
  `;
  const params = [req.user.household_id];
  if (month) { params.push(month); query += ` AND ie.month = $${params.length}`; }
  if (user_id) { params.push(user_id); query += ` AND ie.user_id = $${params.length}`; }
  query += ' ORDER BY ie.month DESC';
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
