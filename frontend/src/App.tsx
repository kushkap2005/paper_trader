import { useState, useCallback } from 'react';
import { Activity } from 'lucide-react';
import { QuotePanel } from './components/QuotePanel';
import { TradePanel } from './components/TradePanel';
import { PortfolioView } from './components/PortfolioView';
import { TradeHistory } from './components/TradeHistory';
import { MiniChart } from './components/MiniChart';
import { usePortfolio } from './hooks/usePortfolio';
import { QuoteResponse } from './types';
import { fetchQuote } from './services/api';

type Tab = 'trade' | 'portfolio' | 'history';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('trade');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [currentQuote, setCurrentQuote] = useState<QuoteResponse | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { portfolio, loading: portfolioLoading, error: portfolioError, refresh: refreshPortfolio } = usePortfolio();

  const handleSymbolSelect = useCallback((symbol: string, price: number) => {
    setSelectedSymbol(symbol);
    setSelectedPrice(price);
    // Also need the full quote for chart — fetch it
    fetchQuote(symbol).then(setCurrentQuote).catch(() => {});
  }, []);

  const handleSymbolClickFromPortfolio = useCallback((symbol: string) => {
    setActiveTab('trade');
    fetchQuote(symbol).then(q => {
      setSelectedSymbol(symbol);
      setSelectedPrice(q.currentPrice);
      setCurrentQuote(q);
    }).catch(() => {});
  }, []);

  const handleTradeSuccess = useCallback(() => {
    refreshPortfolio();
    setRefreshTrigger(t => t + 1);
  }, [refreshPortfolio]);

  const ownedShares =
    portfolio?.holdings.find(h => h.symbol === selectedSymbol)?.quantity ?? 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <Activity size={22} className="logo-icon" />
          <span className="logo-text">PAPER<span className="logo-accent">TRADER</span></span>
          <span className="logo-sub">Virtual Stock Market</span>
        </div>
        <div className="header-right">
          {portfolio && (
            <div className="header-stats">
              <div className="hstat">
                <span className="hstat-label">PORTFOLIO</span>
                <span className="hstat-value">
                  ₹{portfolio.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="hstat">
                <span className="hstat-label">CASH</span>
                <span className="hstat-value">
                  ₹{portfolio.cash.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="hstat">
                <span className="hstat-label">P&L</span>
                <span className={`hstat-value ${portfolio.totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
                  {portfolio.totalProfitLoss >= 0 ? '+' : ''}
                  {portfolio.totalProfitLossPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="nav-tabs">
        {(['trade', 'portfolio', 'history'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'nav-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main">
        {activeTab === 'trade' && (
          <div className="trade-layout">
            <div className="left-col">
              <QuotePanel onSymbolSelect={handleSymbolSelect} />
              <TradePanel
                selectedSymbol={selectedSymbol}
                selectedPrice={selectedPrice}
                cash={portfolio?.cash ?? 0}
                ownedShares={ownedShares}
                onTradeSuccess={handleTradeSuccess}
              />
            </div>
            <div className="right-col">
              {currentQuote && <MiniChart quote={currentQuote} />}
              <PortfolioView
                portfolio={portfolio}
                loading={portfolioLoading}
                error={portfolioError}
                onRefresh={refreshPortfolio}
                onSymbolClick={handleSymbolClickFromPortfolio}
              />
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="full-layout">
            <PortfolioView
              portfolio={portfolio}
              loading={portfolioLoading}
              error={portfolioError}
              onRefresh={refreshPortfolio}
              onSymbolClick={handleSymbolClickFromPortfolio}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="full-layout">
            <TradeHistory refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
