import { useState } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { executeTrade } from '../services/api';

interface TradePanelProps {
  selectedSymbol: string;
  selectedPrice: number;
  cash: number;
  ownedShares: number;
  onTradeSuccess: () => void;
}

export function TradePanel({
  selectedSymbol,
  selectedPrice,
  cash,
  ownedShares,
  onTradeSuccess,
}: TradePanelProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const qty = parseFloat(quantity) || 0;
  const total = qty * selectedPrice;
  const canAfford = total <= cash;
  const canSell = qty <= ownedShares;

  const handleTrade = async () => {
    if (!selectedSymbol || qty <= 0) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await executeTrade({
        symbol: selectedSymbol,
        type: tradeType,
        quantity: qty,
      });
      setSuccess(result.message);
      setQuantity('');
      onTradeSuccess();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const quickQty = (pct: number) => {
    if (tradeType === 'buy' && selectedPrice > 0) {
      const shares = Math.floor((cash * pct) / selectedPrice);
      setQuantity(shares > 0 ? String(shares) : '');
    } else if (tradeType === 'sell' && ownedShares > 0) {
      const shares = Math.floor(ownedShares * pct);
      setQuantity(shares > 0 ? String(shares) : '');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <Zap size={16} className="panel-icon" />
        <span>EXECUTE TRADE</span>
      </div>

      {!selectedSymbol ? (
        <div className="empty-state">Search for a stock above to start trading</div>
      ) : (
        <>
          <div className="selected-symbol">
            <span className="symbol-badge">{selectedSymbol}</span>
            <span className="symbol-price">@ ₹{selectedPrice.toFixed(2)}</span>
          </div>

          <div className="trade-type-toggle">
            <button
              className={`toggle-btn ${tradeType === 'buy' ? 'toggle-buy' : ''}`}
              onClick={() => { setTradeType('buy'); setError(null); }}
            >
              BUY
            </button>
            <button
              className={`toggle-btn ${tradeType === 'sell' ? 'toggle-sell' : ''}`}
              onClick={() => { setTradeType('sell'); setError(null); }}
            >
              SELL
            </button>
          </div>

          <div className="trade-info">
            {tradeType === 'buy'
              ? <span>Available: <strong>₹{cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
              : <span>You own: <strong>{ownedShares} shares</strong></span>
            }
          </div>

          <div className="qty-row">
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Quantity"
              className="qty-input"
              min="1"
              step="1"
            />
          </div>

          <div className="quick-qty">
            {[0.25, 0.5, 0.75, 1].map(pct => (
              <button key={pct} className="chip" onClick={() => quickQty(pct)}>
                {pct * 100}%
              </button>
            ))}
          </div>

          {qty > 0 && (
            <div className="trade-total">
              <span>Total</span>
              <span className="total-value">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {error && <div className="error-box">⚠ {error}</div>}
          {success && (
            <div className="success-box">
              <CheckCircle size={14} /> {success}
            </div>
          )}

          <button
            className={`btn btn-full ${tradeType === 'buy' ? 'btn-buy' : 'btn-sell'}`}
            onClick={handleTrade}
            disabled={
              loading ||
              qty <= 0 ||
              (tradeType === 'buy' && !canAfford) ||
              (tradeType === 'sell' && !canSell)
            }
          >
            {loading ? 'Processing...' : `${tradeType === 'buy' ? 'BUY' : 'SELL'} ${qty > 0 ? qty : ''} SHARES`}
          </button>
        </>
      )}
    </div>
  );
}
