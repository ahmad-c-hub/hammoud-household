# Hammoud Household Finance

A full-stack household budget tracker — income logging, spending tracking, charts, Excel export, and role-based access control.

## Stack

- **Frontend**: React (Vite), React Router v6, Tailwind CSS, Recharts, xlsx, react-hot-toast
- **Backend**: Node.js, Express, JWT auth, bcrypt, pg
- **Database**: PostgreSQL via Neon
- **Deployment**: Render (monorepo)

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd hammoud-household
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Create environment files

**`server/.env`**
```
DATABASE_URL=your_neon_connection_string
JWT_SECRET=some_long_random_secret_string
PORT=4000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**`client/.env`**
```
VITE_API_URL=http://localhost:4000
```

### 3. Run dev servers

```bash
npm run dev
```

Opens both servers concurrently:
- Backend: http://localhost:4000
- Frontend: http://localhost:5173

### 4. First-time setup

Visit http://localhost:5173/setup to create your household and admin account.

---

## Environment Variables

### Server

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs — use a long random string |
| `PORT` | Port for the Express server (default: 4000) |
| `FRONTEND_URL` | URL of the frontend (used for CORS in production) |
| `NODE_ENV` | `development` or `production` |

### Client

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

---

## Render Deployment (in order)

### a. Push to GitHub

```bash
git add -A && git commit -m "initial commit" && git push
```

### b. Create the backend Web Service

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. **Build Command**: `npm install`
5. **Start Command**: `node index.js`
6. Add environment variables:
   - `DATABASE_URL` → your Neon connection string
   - `JWT_SECRET` → your secret key
   - `NODE_ENV` → `production`
7. Click **Create Web Service** and wait for it to deploy
8. Copy the backend URL (e.g. `https://hammoud-household-api.onrender.com`)

### c. Create the frontend Static Site

1. Go to Render → New → Static Site
2. Connect the same GitHub repo
3. Set **Root Directory** to `client`
4. **Build Command**: `npm install && npm run build`
5. **Publish Directory**: `dist`
6. Add environment variable:
   - `VITE_API_URL` → paste the backend URL from step b
7. Click **Create Static Site** and wait for the build
8. Copy the frontend URL (e.g. `https://hammoud-household.onrender.com`)

### d. Link frontend URL to backend

1. Go back to the backend Web Service on Render
2. Add environment variable:
   - `FRONTEND_URL` → paste the frontend URL from step c
3. Click **Save Changes** — Render will redeploy automatically

### e. Initialize your household

Visit `https://your-frontend-url.onrender.com/setup` and fill in:
- Household name
- Admin full name, username, and password

This creates the household, admin account, and default spending categories.

> The `/setup` route only works once — after a household is created it redirects to `/login`.

---

## Using the App

### Adding Categories (Admin)

1. Log in as admin → go to `/admin`
2. Scroll to **Category Management**
3. Type a category name and click **Add**

Default categories are created automatically: Groceries, Car Expenses, Utilities, Dining Out, Healthcare, Education, Entertainment, Clothing, Other.

### Managing Users (Admin)

1. `/admin` → **User Management** → **Add User**
2. Set name, username, password, role, and permissions:
   - **Has Income** — allows the user to log monthly income on the `/income` page
   - **Can Spend** — allows the user to log spending on the `/spend` page

### Exporting Transactions to Excel

1. Go to `/transactions`
2. Apply any filters (date range, category, person)
3. Click **Export to Excel**
4. A file named `household-transactions-YYYY-MM-DD.xlsx` downloads with the currently visible rows

---

## Project Structure

```
hammoud-household/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/client.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/      # Layout, Sidebar, ProtectedRoute, Spinner
│   │   ├── pages/           # Setup, Login, Dashboard, Income, Spend, Transactions, Admin
│   │   └── utils/currency.js
│   └── package.json
├── server/                  # Express backend
│   ├── db/
│   │   ├── schema.sql
│   │   └── init.js
│   ├── middleware/auth.js
│   ├── routes/
│   ├── db.js
│   └── index.js
├── render.yaml
└── package.json
```
