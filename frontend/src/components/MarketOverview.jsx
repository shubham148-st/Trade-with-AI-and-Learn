import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Search, ArrowUpRight, BarChart2, LineChart } from 'lucide-react';
import NiftyModal from './NiftyModal';

const SECTOR_MAP = {
  BANKING: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
  IT: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
  ENERGY: ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'COALINDIA.NS', 'BPCL.NS'],
  AUTO: ['MARUTI.NS', 'M&M.NS', 'BAJAJ-AUTO.NS'],
};

export default function MarketOverview({ stocks, onSelectStock }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [modalIndex, setModalIndex] = useState(null); // { symbol, title }

  const nifty = stocks.find(s => s.symbol === '^NSEI');
  const bankNifty = stocks.find(s => s.symbol === '^NSEBANK');

  const filteredStocks = stocks.filter(s => {
    if (s.symbol.startsWith('^')) return false;

    // Search filter
    const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    // Category / Sector filter
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'GAINERS') return (s.changePct ?? 0) > 0;
    if (activeFilter === 'LOSERS') return (s.changePct ?? 0) < 0;
    if (SECTOR_MAP[activeFilter]) {
      return SECTOR_MAP[activeFilter].includes(s.symbol);
    }
    return true;
  });

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
    { id: 'GAINERS', label: 'Top Gainers' },
    { id: 'LOSERS', label: 'Top Losers' },
    { id: 'BANKING', label: 'Banking' },
    { id: 'IT', label: 'IT & Tech' },
    { id: 'ENERGY', label: 'Energy' },
    { id: 'AUTO', label: 'Automotive' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Index Hero Banners (CLICKABLE TO OPEN CHART MODAL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {[
          { symbol: '^NSEI', name: 'NIFTY 50', data: nifty, desc: 'Benchmark National Stock Exchange 50 • Click to View Chart' },
          { symbol: '^NSEBANK', name: 'NIFTY BANK', data: bankNifty, desc: '12 Banking Super-Weights Index • Click to View Chart' }
        ].map((idx) => {
          const isUp = (idx.data?.changePct ?? 0) >= 0;
          return (
            <div
              key={idx.symbol}
              onClick={() => setModalIndex({ symbol: idx.symbol, title: idx.name })}
              style={{
                background: 'linear-gradient(145deg, var(--bg-card, #1a1d23), #161a22)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent, #00d4aa)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #2a2d35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title="Click to view interactive candlestick chart"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {idx.name}
                  </div>
                  <LineChart size={14} color="var(--accent, #00d4aa)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0' }}>
                  ₹{idx.data?.price ? Number(idx.data.price).toLocaleString('en-IN') : 'Loading...'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent, #00d4aa)', fontWeight: 600 }}>
                  📈 Click to inspect performance graph
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: isUp ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                  color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)',
                  fontWeight: 700,
                  fontSize: '0.95rem'
                }}>
                  {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isUp ? '+' : ''}{idx.data?.change?.toFixed(2) ?? '0.00'} ({idx.data?.changePct?.toFixed(2) ?? '0.00'}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Stocks Table + Gainers/Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(300px, 1fr)', gap: '1.5rem' }}>
        
        {/* Left: Interactive Stock Table */}
        <div style={{
          background: 'var(--bg-card, #1a1d23)',
          border: '1px solid var(--border, #2a2d35)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>NSE Liquid Bluechips</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #8b949e)', marginTop: '2px' }}>
                Click any stock to inspect its chart, price action & fundamentals (AI optional)
              </div>
            </div>

            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-secondary, #22252d)',
              border: '1px solid var(--border, #2a2d35)',
              borderRadius: '8px',
              padding: '6px 12px',
              width: '240px'
            }}>
              <Search size={15} color="var(--text-muted, #8b949e)" />
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main, #f0f2f5)',
                  fontSize: '0.85rem',
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
                  background: activeFilter === f.id ? 'var(--accent, #00d4aa)' : 'var(--bg-secondary, #22252d)',
                  color: activeFilter === f.id ? '#0f1117' : 'var(--text-main, #f0f2f5)',
                  border: `1px solid ${activeFilter === f.id ? 'var(--accent, #00d4aa)' : 'var(--border, #2a2d35)'}`,
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stocks Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border, #2a2d35)', color: 'var(--text-muted, #8b949e)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px 8px' }}>TICKER</th>
                  <th style={{ padding: '10px 8px' }}>COMPANY</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>LTP (₹)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>CHANGE</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>% CHANGE</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #8b949e)' }}>
                      No stocks found matching the filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    const isUp = (stock.changePct ?? 0) >= 0;
                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => onSelectStock(stock.symbol)}
                        style={{
                          borderBottom: '1px solid rgba(42, 45, 53, 0.4)',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--text-main, #f0f2f5)' }}>
                          {stock.symbol.replace('.NS', '')}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted, #8b949e)' }}>
                          {stock.name}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                          ₹{stock.price ? Number(stock.price).toLocaleString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)' }}>
                          {isUp ? '+' : ''}{stock.change ? stock.change.toFixed(2) : '0.00'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            background: isUp ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                            color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)'
                          }}>
                            {isUp ? '▲' : '▼'} {Math.abs(stock.changePct ?? 0).toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStock(stock.symbol);
                            }}
                            style={{
                              background: 'var(--bg-secondary, #22252d)',
                              border: '1px solid var(--border, #2a2d35)',
                              color: 'var(--accent, #00d4aa)',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Chart & Details <ArrowUpRight size={12} />
                          </button>
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
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--green, #2ed573)', fontWeight: 700, fontSize: '0.9rem' }}>
              <TrendingUp size={18} /> Top Gainers Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {gainers.map((g) => (
                <div
                  key={g.symbol}
                  onClick={() => onSelectStock(g.symbol)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary, #22252d)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent, #00d4aa)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{g.symbol.replace('.NS', '')}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #8b949e)' }}>₹{g.price}</div>
                  </div>
                  <div style={{ color: 'var(--green, #2ed573)', fontWeight: 700, fontSize: '0.85rem' }}>
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
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--red, #ff4757)', fontWeight: 700, fontSize: '0.9rem' }}>
              <TrendingDown size={18} /> Top Losers Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {losers.map((l) => (
                <div
                  key={l.symbol}
                  onClick={() => onSelectStock(l.symbol)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary, #22252d)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent, #00d4aa)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{l.symbol.replace('.NS', '')}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #8b949e)' }}>₹{l.price}</div>
                  </div>
                  <div style={{ color: 'var(--red, #ff4757)', fontWeight: 700, fontSize: '0.85rem' }}>
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
