const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/summary', async (req, res) => {
  const { month } = req.query;
  const { household_id } = req.user;

  try {
    const [incomeTotal, incomeByUser, spendTotal, byCategory, byUser] = await Promise.all([
      pool.query(
        'SELECT COALESCE(SUM(amount_cents), 0) AS total FROM income_entries WHERE household_id=$1 AND month=$2',
        [household_id, month]
      ),
      pool.query(
        `SELECT u.name, ie.amount_cents AS amount
         FROM income_entries ie
         JOIN users u ON u.id = ie.user_id
         WHERE ie.household_id=$1 AND ie.month=$2`,
        [household_id, month]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount_cents), 0) AS total
         FROM spend_entries
         WHERE household_id=$1 AND DATE_TRUNC('month', date)=$2::date`,
        [household_id, month]
      ),
      pool.query(
        `SELECT category, SUM(amount_cents) AS amount
         FROM spend_entries
         WHERE household_id=$1 AND DATE_TRUNC('month', date)=$2::date
         GROUP BY category ORDER BY amount DESC`,
        [household_id, month]
      ),
      pool.query(
        `SELECT u.name, SUM(se.amount_cents) AS amount
         FROM spend_entries se
         JOIN users u ON u.id = se.user_id
         WHERE se.household_id=$1 AND DATE_TRUNC('month', se.date)=$2::date
         GROUP BY u.name ORDER BY amount DESC`,
        [household_id, month]
      ),
    ]);

    res.json({
      totalIncome: parseInt(incomeTotal.rows[0].total),
      totalSpent: parseInt(spendTotal.rows[0].total),
      incomeByUser: incomeByUser.rows.map(r => ({ ...r, amount: parseInt(r.amount) })),
      spentByCategory: byCategory.rows.map(r => ({ ...r, amount: parseInt(r.amount) })),
      spentByUser: byUser.rows.map(r => ({ ...r, amount: parseInt(r.amount) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
