import { Clock, RefreshCw } from 'lucide-react';
import { Trade } from '../types';
import { useTrades } from '../hooks/useTrades';

interface TradeHistoryProps {
  refreshTrigger?: number;
}

export function TradeHistory({ refreshTrigger: _refreshTrigger }: TradeHistoryProps) {
  const { trades, loading, error, refresh } = useTrades();

  return (
    <div className="panel panel-wide">
      <div className="panel-header">
        <Clock size={16} className="panel-icon" />
        <span>TRADE HISTORY</span>
        <button className="refresh-btn" onClick={refresh} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      {trades.length === 0 && !loading && (
        <div className="empty-state">No trades yet.</div>
      )}

      {trades.length > 0 && (
        <div className="trades-list">
          {trades.map((trade: Trade) => (
            <div key={trade.id} className={`trade-item trade-${trade.type}`}>
              <div className="trade-left">
                <span className={`trade-badge ${trade.type === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                  {trade.type.toUpperCase()}
                </span>
                <span className="trade-symbol">{trade.symbol}</span>
                <span className="trade-qty">{trade.quantity} shares</span>
              </div>
              <div className="trade-right">
                <span className="trade-price">@ ₹{trade.price.toFixed(2)}</span>
                <span className="trade-total">₹{trade.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                <span className="trade-time">
                  {new Date(trade.timestamp).toLocaleString('en-IN', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <RefreshCw size={16} className="spin" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}
