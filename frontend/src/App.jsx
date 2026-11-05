import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TickerRibbon from './components/TickerRibbon';
import MarketOverview from './components/MarketOverview';
import StockPage from './components/StockPage';
import AIAnalysis from './components/AIAnalysis';
import PaperTrading from './components/PaperTrading';
import AlgoAcademy from './components/AlgoAcademy';
import Footer from './components/Footer';
import { getWatchlistFromCookies, saveWatchlistToCookies } from './utils/cookies';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stocks, setStocks] = useState([]);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(null);
  const [highlightedAlgoId, setHighlightedAlgoId] = useState(null);
  const [prefilledOrder, setPrefilledOrder] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState(() => getWatchlistFromCookies());
  const [backendOnline, setBackendOnline] = useState(true);

  // Helper to resolve route and symbol from URL (Convention: /stocks/SYMBOL and /AI/SYMBOL)
  const resolveRouteFromUrl = () => {
    const path = window.location.pathname.replace(/^\/+/, '').trim();
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    const currentPath = path || hash;

    if (!currentPath) {
      return { tab: 'dashboard', symbol: null };
    }

    if (currentPath.toLowerCase().startsWith('stocks/')) {
      const sym = currentPath.slice(7).trim().toUpperCase();
      return { tab: 'stock-detail', symbol: sym.endsWith('.NS') ? sym : `${sym}.NS` };
    }
    if (currentPath.toUpperCase().startsWith('AI/') || currentPath.toLowerCase().startsWith('ai/')) {
      const sym = currentPath.slice(3).trim().toUpperCase();
      return { tab: 'ai-analysis', symbol: sym ? (sym.endsWith('.NS') ? sym : `${sym}.NS`) : 'RELIANCE.NS' };
    }
    if (currentPath.toLowerCase() === 'ai') {
      return { tab: 'ai-analysis', symbol: 'RELIANCE.NS' };
    }
    if (currentPath.toLowerCase() === 'paper-trading') {
      return { tab: 'paper-trading', symbol: null };
    }
    if (currentPath.toLowerCase() === 'algo-academy') {
      return { tab: 'algo-academy', symbol: null };
    }
    // Fallback for legacy direct /SYMBOL URLs
    const clean = currentPath.toUpperCase();
    if (!clean.startsWith('API') && !clean.includes('.')) {
      return { tab: 'stock-detail', symbol: clean.endsWith('.NS') ? clean : `${clean}.NS` };
    }
    return { tab: 'dashboard', symbol: null };
  };

  // Sync state with URL pathname & hash on initial load and navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const route = resolveRouteFromUrl();
      setActiveTab(route.tab);
      if (route.symbol) {
        setSelectedStockSymbol(route.symbol);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const probeHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    probeHealth();
    fetchStockBatch();
    const interval = setInterval(fetchStockBatch, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStockBatch = async () => {
    setIsRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout guard

    try {
      const res = await fetch('/api/batch_quotes', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setStocks(data);
        setBackendOnline(true);
      }
    } catch (e) {
      setBackendOnline(false);
      if (e.name === 'AbortError') {
        console.warn('Batch quotes timed out, maintaining existing stock cache');
      } else {
        console.error('Failed to load batch quotes', e);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler: Select a stock from Overview / Ticker / Search -> Leads to /stocks/SYMBOL
  const handleSelectStock = (symbol) => {
    const formatted = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    const clean = formatted.replace('.NS', '');
    setSelectedStockSymbol(formatted);
    setActiveTab('stock-detail');
    try {
      window.history.pushState({ symbol: formatted }, '', `/stocks/${clean}`);
    } catch {
      window.location.hash = `#/stocks/${clean}`;
    }
  };

  // Handler: Select a stock for AI Screener -> Leads to /AI/SYMBOL
  const handleSelectStockForAI = (symbol) => {
    const formatted = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    const clean = formatted.replace('.NS', '');
    setSelectedStockSymbol(formatted);
    setActiveTab('ai-analysis');
    try {
      window.history.pushState({ symbol: formatted }, '', `/AI/${clean}`);
    } catch {
      window.location.hash = `#/AI/${clean}`;
    }
  };

  // Handler: General Tab Navigation with clean URLs
  const handleNavigateTab = (tab, symbol = selectedStockSymbol) => {
    setActiveTab(tab);
    const clean = (symbol || 'RELIANCE.NS').replace('.NS', '');
    if (tab === 'dashboard') {
      try { window.history.pushState({}, '', '/'); } catch { window.location.hash = ''; }
    } else if (tab === 'stock-detail') {
      try { window.history.pushState({}, '', `/stocks/${clean}`); } catch { window.location.hash = `#/stocks/${clean}`; }
    } else if (tab === 'ai-analysis') {
      try { window.history.pushState({}, '', `/AI/${clean}`); } catch { window.location.hash = `#/AI/${clean}`; }
    } else {
      try { window.history.pushState({}, '', `/${tab}`); } catch { window.location.hash = `#/${tab}`; }
    }
  };

  // Handler: Return back from Stock Page to Overview
  const handleBackToOverview = () => {
    handleNavigateTab('dashboard');
  };

  // Handler: Click an observed pattern/algo and redirect to Algo Academy explanation
  const handleNavigateToAlgo = (algoId) => {
    setHighlightedAlgoId(algoId);
    handleNavigateTab('algo-academy');
  };

  // Handler: Send signal to Paper Trading
  const handleSendToPaperTrading = (order) => {
    setPrefilledOrder(order);
    handleNavigateTab('paper-trading');
  };

  // Handler: Toggle Watchlist item persisted in cookies
  const handleToggleWatchlist = (symbol) => {
    const formatted = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    setWatchlist(prev => {
      const next = prev.includes(formatted)
        ? prev.filter(s => s !== formatted)
        : [...prev, formatted];
      saveWatchlistToCookies(next);
      return next;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body, #0f1117)' }}>
      {/* Primary Navigation */}
      <Navbar 
        activeTab={activeTab === 'stock-detail' ? 'dashboard' : activeTab} 
        setActiveTab={handleNavigateTab} 
        onRefresh={fetchStockBatch}
        isRefreshing={isRefreshing}
        stocks={stocks}
        onSelectStock={handleSelectStock}
      />

      {/* Backend Disconnected Warning Banner */}
      {!backendOnline && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.25) 100%)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#fca5a5',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          backdropFilter: 'blur(8px)',
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span>
              <strong>Backend Offline:</strong> Flask Quant API (port 5500) is unreachable. Run <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>python nse-dashboard/app.py</code> or <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>npm run dev</code> to enable live market streaming.
            </span>
          </div>
          <button 
            onClick={fetchStockBatch}
            disabled={isRefreshing}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.85rem',
              cursor: isRefreshing ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'background 0.2s'
            }}
          >
            {isRefreshing ? 'Reconnecting...' : 'Retry Connection'}
          </button>
        </div>
      )}

      {/* Left-Moving Ticker Ribbon */}
      <TickerRibbon stocks={stocks} onSelectStock={handleSelectStock} />

      {/* Main Container */}
      <main style={{
        flex: 1,
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'dashboard' && (
          <MarketOverview 
            stocks={stocks} 
            onSelectStock={handleSelectStock}
            onNavigateTab={handleNavigateTab}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'stock-detail' && selectedStockSymbol && (
          <StockPage 
            symbol={selectedStockSymbol}
            onBack={handleBackToOverview}
            onSendToPaperTrading={handleSendToPaperTrading}
            onNavigateToAlgo={handleNavigateToAlgo}
            isInWatchlist={watchlist.includes(selectedStockSymbol)}
            onToggleWatchlist={() => handleToggleWatchlist(selectedStockSymbol)}
          />
        )}

        {activeTab === 'ai-analysis' && (
          <AIAnalysis 
            selectedSymbol={selectedStockSymbol || 'RELIANCE.NS'}
            onSelectSymbol={handleSelectStockForAI}
            onNavigateToAlgo={handleNavigateToAlgo}
            onSendToPaperTrading={handleSendToPaperTrading}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'paper-trading' && (
          <PaperTrading 
            stocks={stocks}
            prefilledOrder={prefilledOrder}
            onOrderDone={() => setPrefilledOrder(null)}
          />
        )}

        {activeTab === 'algo-academy' && (
          <AlgoAcademy 
            highlightedAlgoId={highlightedAlgoId}
            onSelectAlgoForTrading={() => handleNavigateTab('ai-analysis')}
          />
        )}
      </main>

      {/* Slide & Fade Footer */}
      <Footer onNavigateTab={handleNavigateTab} />
    </div>
  );
}
