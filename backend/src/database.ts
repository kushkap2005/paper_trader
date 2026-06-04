import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs = require('sql.js');

let db: any = null;
const DB_PATH = path.join(__dirname, '../../data/paper_trader.json');

// sql.js is in-memory; we persist to a JSON file manually
interface DbState {
  cash: number;
  holdings: HoldingRow[];
  trades: TradeRow[];
  nextHoldingId: number;
  nextTradeId: number;
}

export interface HoldingRow {
  id: number;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  created_at: string;
  updated_at: string;
}

export interface TradeRow {
  id: number;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
}

let state: DbState = {
  cash: 1000000,
  holdings: [],
  trades: [],
  nextHoldingId: 1,
  nextTradeId: 1,
};

function loadState(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    try {
      state = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
      // corrupt file — start fresh
    }
  } else {
    saveState();
  }
}

function saveState(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

// Initialize on module load
loadState();

export function getCash(): number {
  return state.cash;
}

export function updateCash(newCash: number): void {
  state.cash = newCash;
  saveState();
}

export function getHoldings(): HoldingRow[] {
  return state.holdings.filter(h => h.quantity > 0);
}

export function getHolding(symbol: string): HoldingRow | undefined {
  return state.holdings.find(h => h.symbol === symbol.toUpperCase());
}

export function upsertHolding(symbol: string, quantity: number, avgBuyPrice: number): void {
  const upper = symbol.toUpperCase();
  const existing = state.holdings.find(h => h.symbol === upper);
  const now = new Date().toISOString();
  if (existing) {
    existing.quantity = quantity;
    existing.avg_buy_price = avgBuyPrice;
    existing.updated_at = now;
  } else {
    state.holdings.push({
      id: state.nextHoldingId++,
      symbol: upper,
      quantity,
      avg_buy_price: avgBuyPrice,
      created_at: now,
      updated_at: now,
    });
  }
  saveState();
}

export function logTrade(symbol: string, type: 'buy' | 'sell', quantity: number, price: number): void {
  state.trades.unshift({
    id: state.nextTradeId++,
    symbol: symbol.toUpperCase(),
    type,
    quantity,
    price,
    total: quantity * price,
    timestamp: new Date().toISOString(),
  });
  saveState();
}

export function getTrades(limit = 50): TradeRow[] {
  return state.trades.slice(0, limit);
}

export function getDb(): any {
  return db;
}
