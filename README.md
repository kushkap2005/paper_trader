# 📈 PaperTrader — Virtual Stock Market

A full-stack paper trading application. Look up real stock prices, "buy" and "sell" shares with virtual money, and track your portfolio's P&L in real time.

**Stack:** React 18 + TypeScript (Vite) · Node.js + TypeScript (Express) · SQLite (better-sqlite3) · Finnhub Stock API · Recharts

---

## 🏗 Project Structure

```
paper-trader/
├── backend/                  ← Node + Express + TypeScript API server
│   ├── src/
│   │   ├── server.ts         ← Entry point, Express app setup
│   │   ├── types.ts          ← Shared TypeScript interfaces
│   │   ├── database.ts       ← SQLite init & helpers (better-sqlite3)
│   │   ├── stockApi.ts       ← Finnhub API client (with 15s cache)
│   │   └── routes/
│   │       ├── quote.ts      ← GET /api/quote/:symbol
│   │       ├── trades.ts     ← GET/POST /api/trades
│   │       └── portfolio.ts  ← GET /api/portfolio
│   ├── .env                  ← Your API key goes here (see setup)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 ← React + TypeScript (Vite)
│   ├── src/
│   │   ├── main.tsx          ← Vite entry point
│   │   ├── App.tsx           ← Root component + tab routing
│   │   ├── index.css         ← Full dark trading-terminal styles
│   │   ├── types.ts          ← Shared interfaces (mirrors backend)
│   │   ├── services/
│   │   │   └── api.ts        ← fetch() wrappers for all endpoints
│   │   ├── hooks/
│   │   │   ├── usePortfolio.ts
│   │   │   └── useTrades.ts
│   │   └── components/
│   │       ├── QuotePanel.tsx   ← Stock search + live quote card
│   │       ├── TradePanel.tsx   ← Buy/Sell execution panel
│   │       ├── PortfolioView.tsx← Holdings table with P&L
│   │       ├── TradeHistory.tsx ← Chronological trade log
│   │       └── MiniChart.tsx    ← Intraday price chart (Recharts)
│   ├── index.html
│   └── package.json
│
├── data/                     ← SQLite database file lives here (auto-created)
│   └── paper_trader.db
│
├── package.json              ← Root convenience scripts
└── README.md
```

---

## 🚀 Setup & Running

### 1. Prerequisites

- **Node.js LTS** (v18+). Check: `node -v` and `npm -v`

### 2. Get a Free Stock API Key

Go to [https://finnhub.io](https://finnhub.io) → Sign up free → copy your API key.

> **No key?** The app works without one — it returns realistic mock prices for popular symbols (AAPL, GOOGL, MSFT, TSLA, NVDA, META, etc.). Great for testing.

### 3. Install dependencies

```bash
# From the project root
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Configure backend environment

```bash
cd backend
cp .env.example .env
# Edit .env and paste your Finnhub key:
# FINNHUB_API_KEY=your_key_here
```

### 5. Run the backend

```bash
cd backend
npm run dev
# → Server starts on http://localhost:3001
# → SQLite DB auto-created at ../data/paper_trader.db
```

### 6. Run the frontend (new terminal)

```bash
cd frontend
npm run dev
# → Vite dev server on http://localhost:5173
```

Open **http://localhost:5173** in your browser. 🎉

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/quote/:symbol` | Live stock price (Finnhub) |
| GET | `/api/portfolio` | Holdings + cash + total P&L |
| POST | `/api/trades` | Execute buy or sell |
| GET | `/api/trades` | Trade history (last 100) |

### POST /api/trades — Request body

```json
{
  "symbol": "AAPL",
  "type": "buy",
  "quantity": 5
}
```

### Error responses

```json
{ "error": "Insufficient Funds", "message": "Need ₹9475.00 but only have ₹500.00 cash" }
{ "error": "Insufficient Shares", "message": "You own 2 share(s) of AAPL but tried to sell 5" }
{ "error": "Not Found", "message": "Symbol \"XYZ\" not found or has no price data" }
```

---

## 🧪 Testing with curl

```bash
# Health check
curl http://localhost:3001/api/health

# Get a quote
curl http://localhost:3001/api/quote/AAPL

# Buy 3 shares of Apple
curl -X POST http://localhost:3001/api/trades \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","type":"buy","quantity":3}'

# View portfolio
curl http://localhost:3001/api/portfolio

# Sell 1 share
curl -X POST http://localhost:3001/api/trades \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","type":"sell","quantity":1}'

# Trade history
curl http://localhost:3001/api/trades
```

---

## 💡 Design Decisions

- **SQLite via better-sqlite3**: synchronous API fits Express's request/response model well; no async DB boilerplate needed
- **Server-side API key**: Finnhub key never touches the frontend — it's fetched server-side and only the processed price is returned
- **15-second quote cache**: prevents hammering the free-tier Finnhub API when multiple requests come in quickly
- **Shared TypeScript interfaces**: `types.ts` is mirrored in both `backend/src/` and `frontend/src/` — they are kept in sync manually, which is a known trade-off of not using a shared package
- **Weighted average buy price**: when buying more of a stock you already own, the avg price is correctly recalculated
- **Proper HTTP status codes**: 201 for successful trades, 400 for validation/business logic errors, 404 for bad symbols

---

## 📦 Building for Production

```bash
# Build backend
cd backend && npm run build
node dist/server.js

# Build frontend
cd frontend && npm run build
# serve the dist/ folder with any static host
```

---

## Starting Balance

Every new database starts with **₹10,00,000** (₹10 lakh) virtual cash. Delete `data/paper_trader.db` to reset.
