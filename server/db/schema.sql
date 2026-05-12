CREATE TABLE IF NOT EXISTS households (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  household_id INT REFERENCES households(id),
  name VARCHAR NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE,
  password_hash VARCHAR NOT NULL,
  role VARCHAR CHECK(role IN ('admin','member')) NOT NULL,
  has_income BOOLEAN DEFAULT false,
  can_spend BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS income_entries (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  household_id INT REFERENCES households(id),
  amount_cents INT NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS spend_entries (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  household_id INT REFERENCES households(id),
  amount_cents INT NOT NULL,
  category VARCHAR NOT NULL,
  note VARCHAR,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  household_id INT REFERENCES households(id),
  name VARCHAR NOT NULL
);
