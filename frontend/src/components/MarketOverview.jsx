import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Search, ArrowUpRight, BarChart2, ShieldAlert } from 'lucide-react';

export default function MarketOverview({ stocks, onSelectStock }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');

  const nifty = stocks.find(s => s.symbol === '^NSEI');
  const bankNifty = stocks.find(s => s.symbol === '^NSEBANK');

  const filteredStocks = stocks.filter(s => {
    if (s.symbol.startsWith('^')) return false;
    const matchName = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      s.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName;
  });

  const gainers = [...filteredStocks]
    .filter(s => s.changePct !== null && s.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 5);

  const losers = [...filteredStocks]
    .filter(s => s.changePct !== null && s.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Index Hero Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {[
          { name: 'NIFTY 50', data: nifty, desc: 'Benchmark National Stock Exchange 50' },
          { name: 'NIFTY BANK', data: bankNifty, desc: '12 Banking Super-Weights Index' }
        ].map((idx, i) => {
          const isUp = (idx.data?.changePct ?? 0) >= 0;
          return (
            <div
              key={i}
              style={{
                background: 'linear-gradient(145deg, var(--bg-card), #1b2030)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {idx.name}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0' }}>
                  ₹{idx.data?.price ? Number(idx.data.price).toLocaleString('en-IN') : 'Loading...'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{idx.desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: isUp ? 'var(--green)' : 'var(--red)',
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left: Interactive Stock Table */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>NSE Liquid Bluechips</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click any stock to inspect its multi-agent quant score</div>
            </div>
            {/* Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 12px',
              width: '260px'
            }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px 8px' }}>TICKER</th>
                  <th style={{ padding: '10px 8px' }}>COMPANY</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>LTP (₹)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>CHANGE</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>% CHANGE</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isUp = (stock.changePct ?? 0) >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock.symbol)}
                      style={{
                        borderBottom: '1px solid rgba(35, 41, 61, 0.5)',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {stock.symbol.replace('.NS', '')}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                        {stock.name}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                        ₹{stock.price ? Number(stock.price).toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: isUp ? 'var(--green)' : 'var(--red)' }}>
                        {isUp ? '+' : ''}{stock.change ? stock.change.toFixed(2) : '0.00'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                          color: isUp ? 'var(--green)' : 'var(--red)'
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
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            color: 'var(--accent)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Deep Quant <ArrowUpRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Movers & Quick Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Gainers */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--green)', fontWeight: 700, fontSize: '0.9rem' }}>
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
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{g.symbol.replace('.NS', '')}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>₹{g.price}</div>
                  </div>
                  <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.85rem' }}>
                    +{g.changePct?.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--red)', fontWeight: 700, fontSize: '0.9rem' }}>
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
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{l.symbol.replace('.NS', '')}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>₹{l.price}</div>
                  </div>
                  <div style={{ color: 'var(--red)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {l.changePct?.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
