import fetch from 'node-fetch';
import { QuoteResponse } from './types';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

// Simple in-memory cache to avoid hammering free API tier
const quoteCache: Map<string, { data: QuoteResponse; expiry: number }> = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds

export async function fetchQuote(symbol: string): Promise<QuoteResponse> {
  const upperSymbol = symbol.toUpperCase();

  // Check cache
  const cached = quoteCache.get(upperSymbol);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  if (!FINNHUB_API_KEY) {
    // Return mock data if no API key is provided (for testing)
    return getMockQuote(upperSymbol);
  }

  const url = `${FINNHUB_BASE_URL}/quote?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Stock API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as FinnhubQuote;

  if (!data.c || data.c === 0) {
    throw new Error(`Symbol "${upperSymbol}" not found or has no price data`);
  }

  const quote: QuoteResponse = {
    symbol: upperSymbol,
    currentPrice: data.c,
    change: data.d,
    percentChange: data.dp,
    highPrice: data.h,
    lowPrice: data.l,
    openPrice: data.o,
    previousClose: data.pc,
    timestamp: data.t,
  };

  // Cache the result
  quoteCache.set(upperSymbol, { data: quote, expiry: Date.now() + CACHE_TTL_MS });

  return quote;
}

// Mock data for development/testing without API key
function getMockQuote(symbol: string): QuoteResponse {
  const mockPrices: Record<string, number> = {
    AAPL: 189.5,
    GOOGL: 175.2,
    MSFT: 415.3,
    AMZN: 185.8,
    TSLA: 245.6,
    NVDA: 875.4,
    META: 505.2,
    NFLX: 628.9,
    AMD: 178.3,
    INTC: 43.2,
  };

  const basePrice = mockPrices[symbol] || 100 + Math.random() * 400;
  const change = (Math.random() - 0.5) * 10;
  const percentChange = (change / basePrice) * 100;

  return {
    symbol,
    currentPrice: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    percentChange: parseFloat(percentChange.toFixed(4)),
    highPrice: parseFloat((basePrice + Math.abs(change) * 1.5).toFixed(2)),
    lowPrice: parseFloat((basePrice - Math.abs(change) * 1.5).toFixed(2)),
    openPrice: parseFloat((basePrice - change / 2).toFixed(2)),
    previousClose: parseFloat((basePrice - change).toFixed(2)),
    timestamp: Math.floor(Date.now() / 1000),
  };
}
