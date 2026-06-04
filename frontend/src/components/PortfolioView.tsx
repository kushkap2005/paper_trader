import { Briefcase, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Portfolio } from '../types';

interface PortfolioViewProps {
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSymbolClick: (symbol: string) => void;
}

export function PortfolioView({ portfolio, loading, error, onRefresh, onSymbolClick }: PortfolioViewProps) {
  const isOverallPositive = (portfolio?.totalProfitLoss ?? 0) >= 0;

  return (
    <div className="panel panel-wide">
      <div className="panel-header">
        <Briefcase size={16} className="panel-icon" />
        <span>PORTFOLIO</span>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      {portfolio && (
        <>
          <div className="portfolio-summary">
            <div className="summary-card">
              <div className="summary-label">TOTAL VALUE</div>
              <div className="summary-value">
                ₹{portfolio.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">CASH</div>
              <div className="summary-value">
                ₹{portfolio.cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">P&L</div>
              <div className={`summary-value ${isOverallPositive ? 'positive' : 'negative'}`}>
                {isOverallPositive ? '+' : ''}₹{portfolio.totalProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className="pct-badge">
                  {isOverallPositive ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {portfolio.holdings.length === 0 ? (
            <div className="empty-state">No holdings yet. Buy some stocks!</div>
          ) : (
            <div className="holdings-table-wrap">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>SYMBOL</th>
                    <th>QTY</th>
                    <th>AVG PRICE</th>
                    <th>CUR PRICE</th>
                    <th>VALUE</th>
                    <th>P&L</th>
                    <th>P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map(h => {
                    const pl = h.profitLoss ?? 0;
                    const plPct = h.profitLossPercent ?? 0;
                    const isPos = pl >= 0;
                    return (
                      <tr
                        key={h.symbol}
                        className="holding-row"
                        onClick={() => onSymbolClick(h.symbol)}
                      >
                        <td className="symbol-cell">{h.symbol}</td>
                        <td>{h.quantity}</td>
                        <td>₹{h.avgBuyPrice.toFixed(2)}</td>
                        <td>₹{(h.currentPrice ?? 0).toFixed(2)}</td>
                        <td>₹{(h.currentValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={isPos ? 'positive' : 'negative'}>
                          {isPos ? '+' : ''}₹{pl.toFixed(2)}
                        </td>
                        <td className={isPos ? 'positive' : 'negative'}>
                          <span className="pct-pill">
                            {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {isPos ? '+' : ''}{plPct.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {loading && !portfolio && (
        <div className="loading-state">
          <RefreshCw size={20} className="spin" />
          <span>Loading portfolio...</span>
        </div>
      )}
    </div>
  );
}
