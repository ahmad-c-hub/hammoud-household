const express = require('express');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE household_id = $1 ORDER BY name',
      [req.user.household_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminOnly, async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (household_id, name) VALUES ($1,$2) RETURNING *',
      [req.user.household_id, name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
