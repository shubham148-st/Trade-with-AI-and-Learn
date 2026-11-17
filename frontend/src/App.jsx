import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import TickerRibbon from './components/TickerRibbon';
import MarketOverview from './components/MarketOverview';
import Footer from './components/Footer';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { getWatchlistFromCookies, saveWatchlistToCookies } from './utils/cookies';
import usePageVisibility from './hooks/usePageVisibility';
import { fetchWithCache } from './utils/queryCache';

// Lazy-loaded route chunks to minimize initial bundle size
const StockPage = React.lazy(() => import('./components/StockPage'));
const AICommandCenter = React.lazy(() => import('./components/AICommandCenter'));
const PaperTrading = React.lazy(() => import('./components/PaperTrading'));
const AlgoAcademy = React.lazy(() => import('./components/AlgoAcademy'));

function RouteLoadingSkeleton() {
  return (
    <div style={{
      width: '100%',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      padding: '0.5rem 0',
      boxSizing: 'border-box'
    }}>
      <div style={{
        height: '44px',
        width: '320px',
        maxWidth: '100%',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '8px',
        border: '1px solid var(--border, #2a2d35)'
      }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{ height: '110px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border, #2a2d35)' }} />
        <div style={{ height: '110px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border, #2a2d35)' }} />
        <div style={{ height: '110px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border, #2a2d35)' }} />
      </div>
      <div style={{
        height: '420px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: '1px solid var(--border, #2a2d35)'
      }} />
    </div>
  );
}

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
    const rawPath = window.location.pathname.replace(/^\/+/, '').trim();
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();

    // Prefer hash if it points to a specific section/route, otherwise path
    let currentPath = rawHash || rawPath;
    if (rawHash && (rawHash.startsWith('stocks/') || rawHash === 'dashboard' || rawHash === 'overview' || rawHash === 'ai-analysis' || rawHash === 'ai' || rawHash === 'paper-trading' || rawHash === 'algo-academy')) {
      currentPath = rawHash;
    } else if (rawPath) {
      currentPath = rawPath;
    }

    if (!currentPath) {
      return { tab: 'dashboard', symbol: null };
    }

    const lower = currentPath.toLowerCase();

    // 1. Explicit Dashboard / Overview / Root
    if (lower === 'dashboard' || lower === 'overview' || lower === 'home' || lower === '') {
      return { tab: 'dashboard', symbol: null };
    }

    // 2. Stock Detail: /stocks/SYMBOL or #stocks/SYMBOL
    if (lower.startsWith('stocks/')) {
      const sym = currentPath.slice(7).trim().toUpperCase();
      return { tab: 'stock-detail', symbol: sym.endsWith('.NS') ? sym : `${sym}.NS` };
    }

    // 3. AI Command Center: /AI/..., /ai-analysis, /ai
    if (lower.startsWith('ai/')) {
      const sub = currentPath.slice(3).trim().toLowerCase();
      // Supports /AI/pre, /AI/live, /AI/post or legacy /AI/SYMBOL
      if (['pre', 'live', 'post'].includes(sub)) {
        return { tab: 'ai-analysis', symbol: 'RELIANCE.NS', subMode: sub === 'pre' ? 'pre-market' : sub === 'live' ? 'live-trading' : 'post-market' };
      }
      const sym = currentPath.slice(3).trim().toUpperCase();
      return { tab: 'ai-analysis', symbol: sym ? (sym.endsWith('.NS') ? sym : `${sym}.NS`) : 'RELIANCE.NS' };
    }
    if (lower === 'ai' || lower === 'ai-analysis') {
      return { tab: 'ai-analysis', symbol: 'RELIANCE.NS' };
    }

    // 4. Paper Trading: /paper-trading, /trade
    if (lower === 'paper-trading' || lower === 'trade') {
      return { tab: 'paper-trading', symbol: null };
    }

    // 5. Algo Academy: /algo-academy, /academy, /learn
    if (lower === 'algo-academy' || lower === 'academy' || lower === 'learn') {
      return { tab: 'algo-academy', symbol: null };
    }

    // 6. Anchor links / documentation / non-stock tokens from footer/nav
    const nonStockTokens = [
      'docs', 'api', 'changelog', 'about', 'discord', 'support', 
      'disclaimer', 'privacy', 'terms', 'community', 'resources'
    ];
    if (nonStockTokens.includes(lower)) {
      return { tab: 'dashboard', symbol: null };
    }

    // 7. Fallback for legacy direct /SYMBOL URLs (e.g. /TCS or /RELIANCE)
    const clean = currentPath.toUpperCase();
    if (!clean.startsWith('API') && !clean.includes('.')) {
      if (/^[A-Z0-9&-]{2,12}$/.test(clean)) {
        return { tab: 'stock-detail', symbol: clean.endsWith('.NS') ? clean : `${clean}.NS` };
      }
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

  // Polling Backoff Configuration
  const BASE_POLL_INTERVAL = 60000;
  const MAX_POLL_INTERVAL = 300000; // 5-minute cap
  const pollTimerRef = useRef(null);
  const backoffDelayRef = useRef(BASE_POLL_INTERVAL);

  const scheduleNextPoll = (delay) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(() => {
      fetchStockBatch();
    }, delay);
  };

  const fetchStockBatch = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    setIsRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // Generous 20s timeout guard

    try {
      const data = await fetchWithCache('/api/batch_quotes', { signal: controller.signal }, { ttl: 25000, staleWhileRevalidate: true });
      clearTimeout(timeoutId);
      if (Array.isArray(data) && data.length > 0) {
        setStocks(data);
        setBackendOnline(true);
      }
      // Reset backoff interval on successful fetch
      backoffDelayRef.current = BASE_POLL_INTERVAL;
    } catch (e) {
      if (e.name === 'AbortError') {
        console.warn('Batch quotes request timed out, preserving current cached prices');
      } else {
        console.error('Failed to load batch quotes', e);
        fetch('/api/health')
          .then(r => setBackendOnline(r.ok))
          .catch(() => setBackendOnline(false));
      }
      // Exponential backoff: 60s -> 120s -> 240s -> 300s
      backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, MAX_POLL_INTERVAL);
      console.warn(`Quotes polling backing off to ${backoffDelayRef.current / 1000}s`);
    } finally {
      setIsRefreshing(false);
      scheduleNextPoll(backoffDelayRef.current);
    }
  };

  // Re-fetch immediately whenever browser tab visibility transitions from hidden -> visible
  usePageVisibility(fetchStockBatch);

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

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

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

  // Handler: Select a stock for AI Screener without hijacking path to /AI/SYMBOL
  const handleSelectStockForAI = (symbol) => {
    const formatted = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    setSelectedStockSymbol(formatted);
  };

  // Handler: General Tab Navigation with clean URLs
  const handleNavigateTab = (tab, symbol = selectedStockSymbol) => {
    setActiveTab(tab);
    const clean = (symbol || 'RELIANCE.NS').replace('.NS', '');
    try {
      if (tab === 'dashboard') {
        window.history.pushState({ tab: 'dashboard' }, '', '/');
      } else if (tab === 'stock-detail') {
        window.history.pushState({ tab: 'stock-detail', symbol: clean }, '', `/stocks/${clean}`);
      } else if (tab === 'ai-analysis') {
        window.history.pushState({ tab: 'ai-analysis' }, '', `/ai-analysis`);
      } else {
        window.history.pushState({ tab }, '', `/${tab}`);
      }
    } catch {
      if (tab === 'dashboard') {
        window.location.hash = '';
      } else if (tab === 'stock-detail') {
        window.location.hash = `#/stocks/${clean}`;
      } else {
        window.location.hash = `#/${tab}`;
      }
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
        <RouteErrorBoundary>
          <React.Suspense fallback={<RouteLoadingSkeleton />}>
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
              <AICommandCenter 
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
          </React.Suspense>
        </RouteErrorBoundary>
      </main>

      {/* Slide & Fade Footer */}
      <Footer onNavigateTab={handleNavigateTab} />
    </div>
  );
}
