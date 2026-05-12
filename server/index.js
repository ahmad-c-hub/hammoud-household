require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDB = require('./db/init');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/income', require('./routes/income'));
app.use('/api/spend', require('./routes/spend'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/dashboard', require('./routes/dashboard'));

async function start() {
  await initDB();
  require('./jobs/dailyReminder');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
