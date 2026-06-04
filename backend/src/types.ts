// Shared TypeScript interfaces used by both frontend and backend

export interface QuoteResponse {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  timestamp: number;
}

export interface Holding {
  id: number;
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

export interface Trade {
  id: number;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
}

export interface Portfolio {
  cash: number;
  holdings: Holding[];
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
}

export interface TradeRequest {
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
}

export interface ApiError {
  error: string;
  message: string;
}
