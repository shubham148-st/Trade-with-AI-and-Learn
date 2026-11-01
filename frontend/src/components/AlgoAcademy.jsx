import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  CheckCircle, 
  ShieldAlert, 
  Target, 
  TrendingUp, 
  Zap,
  ArrowRight
} from 'lucide-react';

export default function AlgoAcademy({ highlightedAlgoId, onSelectAlgoForTrading }) {
  const [algos, setAlgos] = useState([]);
  const [selectedAlgo, setSelectedAlgo] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    fetch('/api/algos')
      .then(r => r.json())
      .then(data => {
        setAlgos(data);
        if (highlightedAlgoId) {
          const match = data.find(a => a.id === highlightedAlgoId);
          if (match) setSelectedAlgo(match);
        } else if (data.length > 0) {
          setSelectedAlgo(data[0]);
        }
      })
      .catch(console.error);
  }, [highlightedAlgoId]);

  const categories = ['ALL', 'Price Action & Reversal', 'Quantitative & Order Flow', 'Trend Following', 'Volatility & Range Expansion'];

  const filteredAlgos = filterCategory === 'ALL' 
    ? algos 
    : algos.filter(a => a.category.includes(filterCategory) || a.category === filterCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Academy Header */}
      <div style={{
        background: 'linear-gradient(145deg, var(--bg-card), #171b2d)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--amber)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
            <BookOpen size={16} /> QUANTITATIVE & PATTERN KNOWLEDGE BASE FOR NEWBIES
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Algorithmic Trading Strategies & Patterns Explained</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Unravel what institutional algorithms and market makers look for. Click on any pattern or indicator observed in the AI Analysis page to discover its statistical edge, precise entry rules, stop loss protocols, and target zones.
          </p>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                background: filterCategory === cat ? 'var(--amber)' : 'var(--bg-secondary)',
                color: filterCategory === cat ? '#0a0d14' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: filterCategory === cat ? 700 : 500
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Directory on Left + Interactive Deep-Dive on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        
        {/* Left: Algos List */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Algorithmic Directory</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAlgos.map(algo => {
              const isSelected = selectedAlgo?.id === algo.id;
              const isHighlighted = highlightedAlgoId === algo.id;
              return (
                <div
                  key={algo.id}
                  onClick={() => setSelectedAlgo(algo)}
                  style={{
                    background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-secondary)',
                    border: isHighlighted ? '2px solid var(--amber)' : (isSelected ? '1px solid var(--amber)' : '1px solid var(--border)'),
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span>{algo.icon}</span>
                      <span>{algo.name}</span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--green)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {algo.win_rate_est}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {algo.category} • Timeframe: {algo.best_timeframe}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Educational Blueprint */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {!selectedAlgo ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Select a strategy from the left to read its complete breakdown.
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{selectedAlgo.icon}</span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedAlgo.name}</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ background: 'var(--border)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {selectedAlgo.category}
                    </span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {selectedAlgo.badge}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical Win Rate</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)' }}>{selectedAlgo.win_rate_est}</div>
                </div>
              </div>

              {/* What is it for Newbies */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={16} /> What is this pattern? (Plain English for Newbies)
                </h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                  {selectedAlgo.summary}
                </p>
              </div>

              {/* How it Works / Institutional Psychology */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} color="var(--amber)" /> The Underlying Institutional Edge
                </h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
                  {selectedAlgo.how_it_works}
                </p>
              </div>

              {/* 3 Step Action Rules: Entry, Stop-Loss, Target */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={14} /> ENTRY TRIGGER
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '6px', lineHeight: 1.4 }}>
                    {selectedAlgo.entry_rule}
                  </div>
                </div>

                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={14} /> STOP LOSS RULE
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '6px', lineHeight: 1.4 }}>
                    {selectedAlgo.stop_loss_rule}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 229, 179, 0.08)', border: '1px solid rgba(0, 229, 179, 0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} /> TARGET EXIT
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '6px', lineHeight: 1.4 }}>
                    {selectedAlgo.target_rule}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectAlgoForTrading(selectedAlgo.id)}
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #10b981)',
                  color: '#0a0d14',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Scan Market for {selectedAlgo.name} in AI Analysis <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
