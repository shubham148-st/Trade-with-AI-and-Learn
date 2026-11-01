import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MarketOverview from './components/MarketOverview';
import AIAnalysis from './components/AIAnalysis';
import PaperTrading from './components/PaperTrading';
import AlgoAcademy from './components/AlgoAcademy';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stocks, setStocks] = useState([]);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState('RELIANCE.NS');
  const [highlightedAlgoId, setHighlightedAlgoId] = useState(null);
  const [prefilledOrder, setPrefilledOrder] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStockBatch();
    const interval = setInterval(fetchStockBatch, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStockBatch = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/batch_quotes');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStocks(data);
      }
    } catch (e) {
      console.error('Failed to load batch quotes', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler: Select a stock from Overview and jump to AI Analysis
  const handleSelectStock = (symbol) => {
    setSelectedStockSymbol(symbol);
    setActiveTab('ai-analysis');
  };

  // Handler: Click an observed pattern/algo on AI Analysis and redirect to Algo Academy explanation
  const handleNavigateToAlgo = (algoId) => {
    setHighlightedAlgoId(algoId);
    setActiveTab('algo-academy');
  };

  // Handler: Send signal to Paper Trading
  const handleSendToPaperTrading = (order) => {
    setPrefilledOrder(order);
    setActiveTab('paper-trading');
  };

  // Handler: Select algo from academy to run analysis
  const handleSelectAlgoForTrading = () => {
    setActiveTab('ai-analysis');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onRefresh={fetchStockBatch}
        isRefreshing={isRefreshing}
      />

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

        {activeTab === 'ai-analysis' && (
          <AIAnalysis 
            selectedSymbol={selectedStockSymbol}
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
            onSelectAlgoForTrading={handleSelectAlgoForTrading}
          />
        )}
      </main>
    </div>
  );
}
