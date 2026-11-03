import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TickerRibbon from './components/TickerRibbon';
import MarketOverview from './components/MarketOverview';
import StockPage from './components/StockPage';
import AIAnalysis from './components/AIAnalysis';
import PaperTrading from './components/PaperTrading';
import AlgoAcademy from './components/AlgoAcademy';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stocks, setStocks] = useState([]);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(null);
  const [highlightedAlgoId, setHighlightedAlgoId] = useState(null);
  const [prefilledOrder, setPrefilledOrder] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to extract stock symbol from either /COMPANY or #/COMPANY
  const resolveStockFromUrl = () => {
    // 1. Check pathname (e.g. /RELIANCE or /RELIANCE.NS)
    const rawPath = window.location.pathname.replace(/^\/+/, '').trim();
    if (rawPath && !rawPath.startsWith('api') && !rawPath.includes('.')) {
      const clean = rawPath.toUpperCase();
      return clean.endsWith('.NS') ? clean : `${clean}.NS`;
    }
    // 2. Check hash (e.g. #/RELIANCE or #RELIANCE)
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (rawHash) {
      const clean = rawHash.toUpperCase();
      return clean.endsWith('.NS') ? clean : `${clean}.NS`;
    }
    return null;
  };

  // Sync state with URL pathname & hash on initial load and navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const sym = resolveStockFromUrl();
      if (sym) {
        setSelectedStockSymbol(sym);
        setActiveTab('stock-detail');
      } else {
        if (activeTab === 'stock-detail') {
          setActiveTab('dashboard');
        }
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
      const data = await res.json();
      if (Array.isArray(data)) {
        setStocks(data);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.warn('Batch quotes timed out, maintaining existing stock cache');
      } else {
        console.error('Failed to load batch quotes', e);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler: Select a stock from Overview / Ticker / Search -> Leads to Stock Page
  const handleSelectStock = (symbol) => {
    const formatted = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
    const clean = formatted.replace('.NS', '');
    setSelectedStockSymbol(formatted);
    setActiveTab('stock-detail');
    try {
      window.history.pushState({ symbol: formatted }, '', `/${clean}`);
    } catch {
      window.location.hash = `#/${clean}`;
    }
  };

  // Handler: Return back from Stock Page to Overview
  const handleBackToOverview = () => {
    setActiveTab('dashboard');
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
  };

  // Handler: Click an observed pattern/algo and redirect to Algo Academy explanation
  const handleNavigateToAlgo = (algoId) => {
    setHighlightedAlgoId(algoId);
    setActiveTab('algo-academy');
  };

  // Handler: Send signal to Paper Trading
  const handleSendToPaperTrading = (order) => {
    setPrefilledOrder(order);
    setActiveTab('paper-trading');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body, #0f1117)' }}>
      {/* Primary Navigation */}
      <Navbar 
        activeTab={activeTab === 'stock-detail' ? 'dashboard' : activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'stock-detail') {
            try { window.history.pushState({}, '', '/'); } catch { window.location.hash = ''; }
          }
        }} 
        onRefresh={fetchStockBatch}
        isRefreshing={isRefreshing}
        stocks={stocks}
        onSelectStock={handleSelectStock}
      />

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
          />
        )}

        {activeTab === 'stock-detail' && selectedStockSymbol && (
          <StockPage 
            symbol={selectedStockSymbol}
            onBack={handleBackToOverview}
            onSendToPaperTrading={handleSendToPaperTrading}
            onNavigateToAlgo={handleNavigateToAlgo}
          />
        )}

        {activeTab === 'ai-analysis' && (
          <AIAnalysis 
            selectedSymbol={selectedStockSymbol || 'RELIANCE.NS'}
            onSelectSymbol={setSelectedStockSymbol}
            onNavigateToAlgo={handleNavigateToAlgo}
            onSendToPaperTrading={handleSendToPaperTrading}
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
            onSelectAlgoForTrading={() => setActiveTab('ai-analysis')}
          />
        )}
      </main>
    </div>
  );
}
