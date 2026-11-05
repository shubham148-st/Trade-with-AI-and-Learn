import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  LineChart,
  Star
} from 'lucide-react';
import NiftyModal from './NiftyModal';

const SECTOR_MAP = {
  BANKING: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
  IT: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
  ENERGY: ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'COALINDIA.NS', 'BPCL.NS'],
  AUTO: ['MARUTI.NS', 'M&M.NS', 'BAJAJ-AUTO.NS'],
};

// Multi-point miniature intraday sparkline with dashed baseline matching Groww Image 4
function MiniTrendSparkline({ symbol = '', changePct = 0 }) {
  const isUp = (changePct || 0) >= 0;
  const color = isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)';
  
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) % 10000;
  }
  
  const width = 100;
  const height = 28;
  const baselineY = 20; // Dashed baseline
  const startY = baselineY - (isUp ? 2 : -2);
  const endY = isUp 
    ? Math.max(4, baselineY - Math.min(16, Math.max(6, Math.abs(changePct) * 3.5)))
    : Math.min(height - 4, baselineY + Math.min(7, Math.max(4, Math.abs(changePct) * 2.5)));
  
  const numPoints = 14;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = Math.round(t * width);
    let y = startY + (endY - startY) * t;
    if (i > 0 && i < numPoints - 1) {
      const wiggle = Math.sin((i + seed % 5) * 1.2) * 2.2 + Math.cos(i * 1.5 + seed % 3) * 1.2;
      y = Math.max(3, Math.min(height - 3, y + wiggle));
    }
    points.push(`${x},${y.toFixed(1)}`);
  }

  return (
    <div style={{ width: '100px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="100" height="28" viewBox="0 0 100 28" fill="none" style={{ overflow: 'visible' }}>
        {/* Gray dashed baseline as in Groww screenshot */}
        <line
          x1="0"
          y1={baselineY}
          x2="100"
          y2={baselineY}
          stroke="rgba(255, 255, 255, 0.16)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        {/* Intraday natural curve */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function MarketOverview({ 
  stocks = [], 
  onSelectStock, 
  onNavigateTab,
  watchlist = [],
  onToggleWatchlist
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [modalIndex, setModalIndex] = useState(null); // { symbol, title }

  // Sorting state
  const [sortField, setSortField] = useState('symbol');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const nifty = stocks.find(s => s.symbol === '^NSEI');
  const bankNifty = stocks.find(s => s.symbol === '^NSEBANK');

  const filteredStocks = stocks.filter(s => {
    if (s.symbol.startsWith('^')) return false;

    // Search filter
    const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    // Category / Sector / Watchlist filter
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'WATCHLIST') return watchlist.includes(s.symbol);
    if (activeFilter === 'GAINERS') return (s.changePct ?? 0) > 0;
    if (activeFilter === 'LOSERS') return (s.changePct ?? 0) < 0;
    if (SECTOR_MAP[activeFilter]) {
      return SECTOR_MAP[activeFilter].includes(s.symbol);
    }
    return true;
  });

  // Sort filtered stocks
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'symbol') {
      aVal = a.symbol || '';
      bVal = b.symbol || '';
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (sortField === 'name') {
      aVal = a.name || '';
      bVal = b.name || '';
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (sortField === 'price') {
      aVal = Number(a.price || 0);
      bVal = Number(b.price || 0);
    } else if (sortField === 'change') {
      aVal = Number(a.change || 0);
      bVal = Number(b.change || 0);
    } else if (sortField === 'changePct') {
      aVal = Number(a.changePct || 0);
      bVal = Number(b.changePct || 0);
    } else {
      return 0;
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} color="var(--text-muted, #888888)" style={{ opacity: 0.4 }} />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} color="var(--accent, #00d4aa)" /> 
      : <ArrowDown size={12} color="var(--accent, #00d4aa)" />;
  };

  const gainers = [...stocks]
    .filter(s => !s.symbol.startsWith('^') && s.changePct !== null && s.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 5);

  const losers = [...stocks]
    .filter(s => !s.symbol.startsWith('^') && s.changePct !== null && s.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, 5);

  const filterOptions = [
    { id: 'ALL', label: 'All Stocks' },
    { id: 'WATCHLIST', label: `★ Watchlist (${watchlist.length})` },
    { id: 'GAINERS', label: 'Top Gainers' },
    { id: 'LOSERS', label: 'Top Losers' },
    { id: 'BANKING', label: 'Banking' },
    { id: 'IT', label: 'IT & Tech' },
    { id: 'ENERGY', label: 'Energy' },
    { id: 'AUTO', label: 'Automotive' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Index Hero Banners (CLICKABLE TO OPEN CHART MODAL) */}
      <div className="index-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {[
          { symbol: '^NSEI', name: 'NIFTY 50', data: nifty },
          { symbol: '^NSEBANK', name: 'NIFTY BANK', data: bankNifty }
        ].map((idx) => {
          const isUp = (idx.data?.changePct ?? 0) >= 0;
          return (
            <div
              key={idx.symbol}
              onClick={() => setModalIndex({ symbol: idx.symbol, title: idx.name })}
              style={{
                background: 'linear-gradient(135deg, #1a1d23, #22252d)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '10px',
                padding: '1.1rem 1.4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent, #00d4aa)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #2a2d35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888888)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                    {idx.name}
                  </span>
                  <LineChart size={13} color="var(--accent, #00d4aa)" />
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, margin: '2px 0', color: '#ffffff' }}>
                  ₹{idx.data?.price ? Number(idx.data.price).toLocaleString('en-IN') : 'Loading...'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isUp ? 'rgba(46, 213, 115, 0.12)' : 'rgba(255, 71, 87, 0.12)',
                  color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isUp ? '+' : ''}{idx.data?.change?.toFixed(2) ?? '0.00'} ({idx.data?.changePct?.toFixed(2) ?? '0.00'}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Stocks Table + Gainers/Losers */}
      <div className="responsive-grid-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.3fr) minmax(280px, 1fr)', gap: '1.25rem' }}>
        
        {/* Left: Interactive All Stocks Table */}
        <div style={{
          background: 'var(--bg-card, #1a1d23)',
          border: '1px solid var(--border, #2a2d35)',
          borderRadius: '10px',
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              All Stocks
            </h2>

            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-bar, #12141a)',
              border: '1px solid var(--border, #2a2d35)',
              borderRadius: '6px',
              padding: '4px 10px',
              width: '220px'
            }}>
              <Search size={14} color="var(--text-muted, #888888)" />
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main, #d1d5db)',
                  fontSize: '0.8rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Liquid Filter Buttons / Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border, #2a2d35)', paddingBottom: '0.75rem' }}>
            {filterOptions.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  background: activeFilter === f.id ? 'var(--accent, #00d4aa)' : 'rgba(255,255,255,0.04)',
                  color: activeFilter === f.id ? '#0f1117' : 'var(--text-muted, #888888)',
                  border: `1px solid ${activeFilter === f.id ? 'var(--accent, #00d4aa)' : 'var(--border, #2a2d35)'}`,
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stocks Table with Click-to-Sort Headers & Trend Sparklines */}
          <div className="table-responsive-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border, #2a2d35)', color: 'var(--text-muted, #888888)', fontSize: '0.72rem', userSelect: 'none' }}>
                  <th 
                    onClick={() => handleSort('symbol')}
                    style={{ padding: '8px 8px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      SYMBOL {renderSortIndicator('symbol')}
                    </div>
                  </th>
                  <th 
                    className="col-hide-mobile"
                    onClick={() => handleSort('name')}
                    style={{ padding: '8px 8px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      COMPANY {renderSortIndicator('name')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('price')}
                    style={{ padding: '8px 8px', textAlign: 'right', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      MARKET PRICE (₹) {renderSortIndicator('price')}
                    </div>
                  </th>
                  <th 
                    className="col-hide-mobile"
                    onClick={() => handleSort('change')}
                    style={{ padding: '8px 8px', textAlign: 'right', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      CHANGE {renderSortIndicator('change')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('changePct')}
                    style={{ padding: '8px 8px', textAlign: 'right', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      % CHANGE {renderSortIndicator('changePct')}
                    </div>
                  </th>
                  <th className="col-hide-mobile" style={{ padding: '8px 16px 8px 16px', textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100px' }}>
                      TREND
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #888888)' }}>
                      No stocks found matching the filter or search query.
                    </td>
                  </tr>
                ) : (
                  sortedStocks.map((stock) => {
                    const isUp = (stock.changePct ?? 0) >= 0;
                    const isWatched = watchlist.includes(stock.symbol);
                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => onSelectStock(stock.symbol)}
                        style={{
                          borderBottom: '1px solid rgba(42, 45, 53, 0.4)',
                          cursor: 'pointer',
                          transition: 'background 0.12s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 8px', fontWeight: 600, color: '#ffffff' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleWatchlist && onToggleWatchlist(stock.symbol);
                              }}
                              title={isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: isWatched ? '#f59e0b' : 'rgba(255, 255, 255, 0.25)',
                                transition: 'color 0.15s ease'
                              }}
                            >
                              <Star size={14} fill={isWatched ? '#f59e0b' : 'none'} />
                            </button>
                            <span>{stock.symbol.replace('.NS', '')}</span>
                          </div>
                        </td>
                        <td className="col-hide-mobile" style={{ padding: '10px 8px', color: 'var(--text-muted, #888888)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {stock.name}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-main, #d1d5db)' }}>
                          ₹{stock.price ? Number(stock.price).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="col-hide-mobile" style={{ padding: '10px 8px', textAlign: 'right', color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)' }}>
                          {isUp ? '+' : ''}{stock.change ? stock.change.toFixed(2) : '0.00'}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isUp ? 'rgba(46, 213, 115, 0.12)' : 'rgba(255, 71, 87, 0.12)',
                            color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)'
                          }}>
                            {isUp ? '▲' : '▼'} {Math.abs(stock.changePct ?? 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="col-hide-mobile" style={{ padding: '6px 16px 6px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100px' }}>
                            <MiniTrendSparkline symbol={stock.symbol} changePct={stock.changePct} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Movers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Top Gainers */}
          <div style={{
            background: 'var(--bg-card, #1a1d23)',
            border: '1px solid var(--border, #2a2d35)',
            borderRadius: '10px',
            padding: '1.1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.85rem', color: 'var(--green, #2ed573)', fontWeight: 700, fontSize: '0.85rem' }}>
              <TrendingUp size={16} /> Top Gainers Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {gainers.map((g) => (
                <div
                  key={g.symbol}
                  onClick={() => onSelectStock(g.symbol)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-bar, #12141a)',
                    border: '1px solid rgba(42, 45, 53, 0.5)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent, #00d4aa)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(42, 45, 53, 0.5)'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff' }}>{g.symbol.replace('.NS', '')}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>₹{g.price}</div>
                  </div>
                  <div style={{ color: 'var(--green, #2ed573)', fontWeight: 700, fontSize: '0.82rem' }}>
                    +{g.changePct?.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div style={{
            background: 'var(--bg-card, #1a1d23)',
            border: '1px solid var(--border, #2a2d35)',
            borderRadius: '10px',
            padding: '1.1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.85rem', color: 'var(--red, #ff4757)', fontWeight: 700, fontSize: '0.85rem' }}>
              <TrendingDown size={16} /> Top Losers Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {losers.map((l) => (
                <div
                  key={l.symbol}
                  onClick={() => onSelectStock(l.symbol)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-bar, #12141a)',
                    border: '1px solid rgba(42, 45, 53, 0.5)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent, #00d4aa)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(42, 45, 53, 0.5)'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff' }}>{l.symbol.replace('.NS', '')}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>₹{l.price}</div>
                  </div>
                  <div style={{ color: 'var(--red, #ff4757)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {l.changePct?.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* NIFTY 50 / NIFTY BANK Performance Chart Modal */}
      {modalIndex && (
        <NiftyModal
          symbol={modalIndex.symbol}
          title={modalIndex.title}
          onClose={() => setModalIndex(null)}
        />
      )}

    </div>
  );
}
