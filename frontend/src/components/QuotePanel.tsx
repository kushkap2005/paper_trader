import { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Search, RefreshCw } from 'lucide-react';
import { QuoteResponse } from '../types';
import { fetchQuote } from '../services/api';

interface QuotePanelProps {
  onSymbolSelect: (symbol: string, price: number) => void;
}

const POPULAR_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

export function QuotePanel({ onSymbolSelect }: QuotePanelProps) {
  const [input, setInput] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (sym: string) => {
    const symbol = sym.trim().toUpperCase();
    if (!symbol) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuote(symbol);
      setQuote(data);
      onSymbolSelect(symbol, data.currentPrice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quote');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [onSymbolSelect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(input);
  };

  const isPositive = (quote?.change ?? 0) >= 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <Search size={16} className="panel-icon" />
        <span>MARKET QUOTE</span>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder="Enter symbol (e.g. AAPL)"
          className="symbol-input"
          maxLength={10}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <RefreshCw size={14} className="spin" /> : 'QUOTE'}
        </button>
      </form>

      <div className="quick-symbols">
        {POPULAR_SYMBOLS.map(sym => (
          <button
            key={sym}
            className={`chip ${quote?.symbol === sym ? 'chip-active' : ''}`}
            onClick={() => { setInput(sym); search(sym); }}
          >
            {sym}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-box">
          <span>⚠ {error}</span>
        </div>
      )}

      {quote && (
        <div className="quote-card">
          <div className="quote-header">
            <div>
              <div className="quote-symbol">{quote.symbol}</div>
              <div className="quote-time">
                {new Date(quote.timestamp * 1000).toLocaleTimeString()}
              </div>
            </div>
            <div className={`quote-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span>{isPositive ? '+' : ''}{quote.percentChange.toFixed(2)}%</span>
            </div>
          </div>

          <div className="quote-price">
            ₹{quote.currentPrice.toFixed(2)}
          </div>
          <div className={`quote-change-abs ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}₹{quote.change.toFixed(2)} today
          </div>

          <div className="quote-stats">
            <div className="stat">
              <span className="stat-label">OPEN</span>
              <span className="stat-value">₹{quote.openPrice.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">HIGH</span>
              <span className="stat-value positive">₹{quote.highPrice.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">LOW</span>
              <span className="stat-value negative">₹{quote.lowPrice.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">PREV</span>
              <span className="stat-value">₹{quote.previousClose.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
