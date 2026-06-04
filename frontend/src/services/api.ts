import { QuoteResponse, Portfolio, Trade, TradeRequest } from '../types';

const BASE_URL = 'http://localhost:3001/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchQuote(symbol: string): Promise<QuoteResponse> {
  const res = await fetch(`${BASE_URL}/quote/${encodeURIComponent(symbol)}`);
  return handleResponse<QuoteResponse>(res);
}

export async function fetchPortfolio(): Promise<Portfolio> {
  const res = await fetch(`${BASE_URL}/portfolio`);
  return handleResponse<Portfolio>(res);
}

export async function fetchTrades(): Promise<Trade[]> {
  const res = await fetch(`${BASE_URL}/trades`);
  return handleResponse<Trade[]>(res);
}

export async function executeTrade(trade: TradeRequest): Promise<{ message: string; price: number; total: number }> {
  const res = await fetch(`${BASE_URL}/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade),
  });
  return handleResponse(res);
}
