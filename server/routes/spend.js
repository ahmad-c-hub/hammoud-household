const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.post('/', async (req, res) => {
  if (!req.user.can_spend) return res.status(403).json({ error: 'Not authorized to log spending' });
  const { amount, category, date, note } = req.body;
  const amountCents = Math.round(parseFloat(amount) * 100);
  try {
    const result = await pool.query(
      'INSERT INTO spend_entries (user_id, household_id, amount_cents, category, note, date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, req.user.household_id, amountCents, category, note || null, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { start, end, category, user_id } = req.query;
  let query = `
    SELECT se.*, u.name AS user_name
    FROM spend_entries se
    JOIN users u ON u.id = se.user_id
    WHERE se.household_id = $1
  `;
  const params = [req.user.household_id];
  if (start) { params.push(start); query += ` AND se.date >= $${params.length}`; }
  if (end) { params.push(end); query += ` AND se.date <= $${params.length}`; }
  if (category) { params.push(category); query += ` AND se.category = $${params.length}`; }
  if (user_id) { params.push(user_id); query += ` AND se.user_id = $${params.length}`; }
  query += ' ORDER BY se.date DESC, se.created_at DESC';
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await pool.query('SELECT * FROM spend_entries WHERE id = $1', [req.params.id]);
    if (!entry.rows[0]) return res.status(404).json({ error: 'Entry not found' });
    if (req.user.role !== 'admin' && entry.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }
    await pool.query('DELETE FROM spend_entries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
