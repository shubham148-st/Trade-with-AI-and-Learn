import React from 'react';

const FALLBACK_TICKERS = [
  { symbol: 'RELIANCE.NS', price: 2980.50, changePct: 1.25 },
  { symbol: 'TCS.NS', price: 3890.10, changePct: 0.85 },
  { symbol: 'HDFCBANK.NS', price: 1680.40, changePct: -0.42 },
  { symbol: 'INFY.NS', price: 1720.00, changePct: 2.10 },
  { symbol: 'ICICIBANK.NS', price: 1195.30, changePct: 0.65 },
  { symbol: 'SBIN.NS', price: 815.20, changePct: -0.90 },
  { symbol: 'M&M.NS', price: 2950.00, changePct: 1.80 },
  { symbol: 'ITC.NS', price: 472.50, changePct: 0.30 },
  { symbol: 'BHARTIARTL.NS', price: 1420.00, changePct: 1.15 },
  { symbol: 'LT.NS', price: 3560.00, changePct: -0.35 },
];

export default function TickerRibbon({ stocks = [], onSelectStock }) {
  // Filter out index symbols or items without price
  const validStocks = stocks.filter(s => s && !s.symbol?.startsWith('^') && s.price !== null);
  const displayStocks = validStocks.length > 0 ? validStocks : FALLBACK_TICKERS;

  // Duplicate for seamless infinite loop
  const loopItems = [...displayStocks, ...displayStocks];

  return (
    <div className="ticker-ribbon" style={{
      background: 'var(--bg-bar, #12141a)',
      borderBottom: '1px solid var(--border, #2a2d35)',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      padding: '8px 0',
      position: 'relative',
      zIndex: 50,
      width: '100%'
    }}>
      <div className="ticker-track" style={{
        display: 'inline-flex',
        animation: 'scroll-left 45s linear infinite',
        gap: '32px',
        width: 'max-content'
      }}>
        {loopItems.map((s, index) => {
          const isUp = (s.changePct || 0) >= 0;
          return (
            <span
              key={`${s.symbol}-${index}`}
              onClick={() => onSelectStock && onSelectStock(s.symbol)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '4px',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title={`Click to inspect ${s.symbol.replace('.NS', '')}`}
            >
              <span style={{ fontWeight: 700, color: '#f0f2f5' }}>
                {s.symbol.replace('.NS', '')}
              </span>
              <span style={{ color: '#8b949e' }}>
                ₹{Number(s.price).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </span>
              <span style={{
                color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)',
                fontWeight: 700,
                fontSize: '0.78rem'
              }}>
                {isUp ? '▲ +' : '▼ '}{Math.abs(s.changePct || 0).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
