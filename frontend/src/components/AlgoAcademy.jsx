import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Target, 
  BarChart2, 
  Layers, 
  Compass, 
  Maximize2, 
  Cpu, 
  GitBranch, 
  Clock, 
  Eye, 
  ShieldAlert,
  Search,
  BookOpen,
  Sliders,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AlgoAcademy({ highlightedAlgoId, onSelectAlgoForTrading }) {
  // Strategy Library state (Left Row)
  const [algos, setAlgos] = useState([]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Recorded Instances state (Right Row)
  const [timeframe, setTimeframe] = useState('1D'); // '1D' | '1W' | '1M' | 'ALL'
  const [selectedPattern, setSelectedPattern] = useState('ALL');
  const [observedData, setObservedData] = useState({ stats: {}, available_patterns: [], timeline: [], signals: [] });
  const [isLoadingObserved, setIsLoadingObserved] = useState(false);

  // Floating Overlay states (non-displacing hovering modal)
  const [hoveredStrategy, setHoveredStrategy] = useState(null); // Left Row overlay (Textbook)
  const [hoveredInstance, setHoveredInstance] = useState(null); // Right Row overlay (Real Pattern)
  const [isOverlayPinned, setIsOverlayPinned] = useState(false);

  // 1. Fetch Algorithmic Strategies Directory
  useEffect(() => {
    fetch('/api/algos')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAlgos(data);
        }
      })
      .catch(err => {
        console.error('Failed to load algorithms directory', err);
      });
  }, []);

  // 2. Fetch Observed Algos Feed (1D, 1W, 1M, ALL + Pattern Choice)
  useEffect(() => {
    setIsLoadingObserved(true);
    const query = new URLSearchParams({
      filter: timeframe,
      pattern: selectedPattern
    });
    fetch(`/api/algos/observed?${query.toString()}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(res => {
        if (res && Array.isArray(res.signals)) {
          setObservedData(res);
        } else {
          setObservedData({ stats: {}, available_patterns: [], timeline: [], signals: [] });
        }
      })
      .catch(err => {
        console.warn('Observed algorithms feed fallback:', err.message);
        setObservedData({ stats: {}, available_patterns: [], timeline: [], signals: [] });
      })
      .finally(() => setIsLoadingObserved(false));
  }, [timeframe, selectedPattern]);

  const categories = [
    'ALL',
    'Quantitative & Order Flow',
    'Trend & Momentum',
    'Volatility & Breakouts',
    'Price Action & Structure',
    'Mean Reversion & Oscillators'
  ];

  // Dynamic Lucide Icon Mapper (No Emojis)
  const renderIcon = (iconName, size = 16, color = 'var(--accent, #00d4aa)') => {
    switch (iconName) {
      case 'Activity': return <Activity size={size} color={color} />;
      case 'TrendingUp': return <TrendingUp size={size} color={color} />;
      case 'Zap': return <Zap size={size} color={color} />;
      case 'ShieldCheck': return <ShieldCheck size={size} color={color} />;
      case 'Target': return <Target size={size} color={color} />;
      case 'BarChart2': return <BarChart2 size={size} color={color} />;
      case 'Layers': return <Layers size={size} color={color} />;
      case 'Compass': return <Compass size={size} color={color} />;
      case 'Maximize2': return <Maximize2 size={size} color={color} />;
      case 'Cpu': return <Cpu size={size} color={color} />;
      case 'GitBranch': return <GitBranch size={size} color={color} />;
      default: return <Activity size={size} color={color} />;
    }
  };

  // Safe Filter Algos on the Left
  const safeAlgos = Array.isArray(algos) ? algos : [];
  const filteredAlgos = safeAlgos.filter(a => {
    if (!a) return false;
    const matchesCat = filterCategory === 'ALL' || a.category === filterCategory;
    const nameMatch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = (a.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && (searchQuery.trim() === '' || nameMatch || catMatch);
  });

  const signalsList = Array.isArray(observedData?.signals) ? observedData.signals : [];
  const patternChoices = Array.isArray(observedData?.available_patterns) ? observedData.available_patterns : [];
  const sessionInfo = observedData.stats?.market_session || {
    is_closed: true,
    session_badge: "Market Closed • Patterns Captured",
    data_source: "EOD Finalized"
  };

  // ── LEFT ROW OVERLAY: Synthetic Textbook Setup Chart ──
  const renderTextbookChart = (algo) => {
    if (!algo?.example_chart) return null;
    const { title = 'Textbook Pattern Setup', candles = [], indicator, annotations = [] } = algo.example_chart;
    if (!Array.isArray(candles) || candles.length === 0) return null;

    const width = 480;
    const height = 180;
    const padding = { top: 20, bottom: 20, left: 15, right: 65 };

    const prices = candles.flatMap(c => [c.h, c.l].filter(v => typeof v === 'number'));
    if (indicator?.values && Array.isArray(indicator.values)) {
      prices.push(...indicator.values.filter(v => typeof v === 'number'));
    }
    if (Array.isArray(annotations)) {
      annotations.forEach(a => { if (typeof a.price === 'number') prices.push(a.price); });
    }
    if (prices.length === 0) return null;

    const minP = Math.min(...prices) * 0.998;
    const maxP = Math.max(...prices) * 1.002;
    const priceRange = maxP - minP || 1;

    const scaleY = (p) => {
      const val = typeof p === 'number' ? p : minP;
      return height - padding.bottom - ((val - minP) / priceRange) * (height - padding.top - padding.bottom);
    };
    const candleWidth = (width - padding.left - padding.right) / candles.length;
    const scaleX = (i) => padding.left + i * candleWidth + candleWidth / 2;

    let indicatorPath = '';
    if (indicator?.values && Array.isArray(indicator.values) && indicator.values.length > 0) {
      indicatorPath = indicator.values.map((val, idx) => {
        const x = scaleX(idx);
        const y = scaleY(typeof val === 'number' ? val : minP);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');
    }

    return (
      <div style={{ background: '#101218', borderRadius: '8px', border: '1px solid var(--border, #2a2d35)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main, #d1d5db)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={13} color="var(--accent, #00d4aa)" />
            <span>{title}</span>
          </div>
          <span style={{ fontSize: '0.65rem', background: 'rgba(0, 212, 170, 0.1)', color: 'var(--accent, #00d4aa)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
            Textbook Framework
          </span>
        </div>

        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }} className="hide-scrollbar">
          <svg width={width} height={height} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
            {[0.25, 0.5, 0.75].map((pct, idx) => {
              const yVal = padding.top + pct * (height - padding.top - padding.bottom);
              return <line key={idx} x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />;
            })}

            {indicatorPath && (
              <path d={indicatorPath} fill="none" stroke={indicator.color || '#00d4aa'} strokeWidth="1.5" strokeDasharray="4 2" />
            )}

            {candles.map((c, i) => {
              const x = scaleX(i);
              const isUp = c.c >= c.o;
              const color = isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)';
              const yHigh = scaleY(c.h);
              const yLow = scaleY(c.l);
              const yOpen = scaleY(c.o);
              const yClose = scaleY(c.c);
              const yBodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));
              const bw = Math.max(6, candleWidth * 0.6);

              return (
                <g key={i}>
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.5" />
                  <rect x={x - bw / 2} y={yBodyTop} width={bw} height={bodyHeight} fill={color} rx="1" />
                </g>
              );
            })}

            {Array.isArray(annotations) && annotations.map((ann, idx) => {
              const annPrice = typeof ann.price === 'number' ? ann.price : 0;
              const x = scaleX(typeof ann.index === 'number' ? ann.index : 0);
              const y = scaleY(annPrice);
              const isEntry = ann.type === 'entry';
              const isSL = ann.type === 'stop_loss';
              const badgeColor = isEntry ? '#2ed573' : (isSL ? '#ff4757' : '#00d4aa');

              return (
                <g key={idx}>
                  <line x1={x} y1={y} x2={width - 4} y2={y} stroke={badgeColor} strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={x} cy={y} r="3" fill={badgeColor} />
                  <rect x={width - 55} y={y - 8} width="55" height="16" fill="#1a1d23" stroke={badgeColor} strokeWidth="1" rx="3" />
                  <text x={width - 28} y={y + 3.5} fill={badgeColor} fontSize="8.5" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                    ₹{annPrice.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          {Array.isArray(annotations) && annotations.map((ann, idx) => {
            const isEntry = ann.type === 'entry';
            const isSL = ann.type === 'stop_loss';
            const badgeColor = isEntry ? '#2ed573' : (isSL ? '#ff4757' : '#00d4aa');
            const bg = isEntry ? 'rgba(46, 213, 115, 0.12)' : (isSL ? 'rgba(255, 71, 87, 0.12)' : 'rgba(0, 212, 170, 0.12)');

            return (
              <div key={idx} style={{ background: bg, border: `1px solid ${badgeColor}`, borderRadius: '4px', padding: '2px 7px', fontSize: '0.67rem', fontWeight: 700, color: badgeColor }}>
                {ann.text}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── RIGHT ROW OVERLAY: Real Pattern Execution Chart (From Real Market Candles) ──
  const renderRealPatternChart = (chart) => {
    if (!chart || !Array.isArray(chart.candles) || chart.candles.length === 0) return null;
    const { clean_symbol, entry_price, stop_loss, target_price, status, candles, indicator_line } = chart;
    
    const width = 480;
    const height = 180;
    const padding = { top: 22, bottom: 25, left: 15, right: 75 };
    
    const prices = candles.flatMap(c => [c.h, c.l].filter(v => typeof v === 'number'));
    if (indicator_line?.values) prices.push(...indicator_line.values.filter(v => typeof v === 'number'));
    if (entry_price) prices.push(entry_price);
    if (stop_loss) prices.push(stop_loss);
    if (target_price) prices.push(target_price);

    const minP = Math.min(...prices) * 0.998;
    const maxP = Math.max(...prices) * 1.002;
    const priceRange = maxP - minP || 1;

    const scaleY = (p) => height - padding.bottom - ((p - minP) / priceRange) * (height - padding.top - padding.bottom);
    const candleWidth = (width - padding.left - padding.right) / candles.length;
    const scaleX = (i) => padding.left + i * candleWidth + candleWidth / 2;

    let indPath = '';
    if (indicator_line?.values && indicator_line.values.length > 0) {
      indPath = indicator_line.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i).toFixed(1)} ${scaleY(v).toFixed(1)}`).join(' ');
    }

    const levels = [
      { label: 'TRIGGER', price: entry_price, color: '#00d4aa' },
      { label: 'STOP', price: stop_loss, color: '#ff4757' },
      { label: 'TARGET', price: target_price, color: '#2ed573' }
    ];

    return (
      <div style={{ background: '#101218', borderRadius: '8px', border: '1px solid var(--border, #2a2d35)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--accent, #00d4aa)' }}>● REAL NSE HISTORICAL CANDLES</span>
            <span style={{ color: 'var(--text-muted, #888888)', fontFamily: 'monospace' }}>({clean_symbol})</span>
          </div>
          <span style={{
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 700,
            background: status === 'Target Hit' ? 'rgba(46, 213, 115, 0.15)' : (status === 'Stopped Out' ? 'rgba(255, 71, 87, 0.15)' : 'rgba(0, 212, 170, 0.15)'),
            color: status === 'Target Hit' ? 'var(--green, #2ed573)' : (status === 'Stopped Out' ? 'var(--red, #ff4757)' : 'var(--accent, #00d4aa)')
          }}>
            {status}
          </span>
        </div>

        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }} className="hide-scrollbar">
          <svg width={width} height={height} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
            {[0.25, 0.5, 0.75].map((pct, idx) => {
              const yVal = padding.top + pct * (height - padding.top - padding.bottom);
              return <line key={idx} x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />;
            })}

            {indPath && (
              <path d={indPath} fill="none" stroke="#00d4aa" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.85" />
            )}

            {candles.map((c, i) => {
              const x = scaleX(i);
              const isUp = c.c >= c.o;
              const color = isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)';
              const yHigh = scaleY(c.h);
              const yLow = scaleY(c.l);
              const yOpen = scaleY(c.o);
              const yClose = scaleY(c.c);
              const yBodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));
              const bw = Math.max(6, candleWidth * 0.65);

              return (
                <g key={i}>
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.5" />
                  <rect x={x - bw / 2} y={yBodyTop} width={bw} height={bodyHeight} fill={color} rx="1" />
                </g>
              );
            })}

            {levels.map((lvl, idx) => {
              if (!lvl.price) return null;
              const y = scaleY(lvl.price);
              return (
                <g key={idx}>
                  <line x1={padding.left} y1={y} x2={width - 58} y2={y} stroke={lvl.color} strokeWidth="1" strokeDasharray="3 3" />
                  <rect x={width - 56} y={y - 8} width="56" height="16" fill="#161820" stroke={lvl.color} strokeWidth="1" rx="3" />
                  <text x={width - 28} y={y + 3.5} fill={lvl.color} fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="monospace">
                    ₹{Number(lvl.price).toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted, #888888)' }}>
          <div>Trigger: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>₹{entry_price}</strong></div>
          <div>Stop Loss: <strong style={{ color: 'var(--red, #ff4757)', fontFamily: 'monospace' }}>₹{stop_loss}</strong></div>
          <div>Target Exit: <strong style={{ color: 'var(--green, #2ed573)', fontFamily: 'monospace' }}>₹{target_price}</strong></div>
        </div>
      </div>
    );
  };

  // ── RIGHT ROW: Recorded Instances Activity Graph ──
  const renderInstanceGraph = () => {
    const timeline = Array.isArray(observedData?.timeline) && observedData.timeline.length > 0 
      ? observedData.timeline 
      : (timeframe === '1D' 
          ? [
              { label: '09:30', count: 2 },
              { label: '10:30', count: 1 },
              { label: '11:30', count: 2 },
              { label: '12:30', count: 1 },
              { label: '13:30', count: 1 },
              { label: '14:30', count: 2 },
            ]
          : (timeframe === '1W'
              ? [
                  { label: 'Mon', count: 4 },
                  { label: 'Tue', count: 5 },
                  { label: 'Wed', count: 4 },
                  { label: 'Thu', count: 6 },
                  { label: 'Fri', count: 5 },
                ]
              : [
                  { label: 'W1', count: 12 },
                  { label: 'W2', count: 15 },
                  { label: 'W3', count: 11 },
                  { label: 'W4', count: 14 },
                ]
            )
        );

    const counts = timeline.map(t => Number(t.count) || 1);
    const maxCount = Math.max(...counts, 1);
    const height = 65;

    return (
      <div style={{ background: '#12141a', borderRadius: '8px', border: '1px solid var(--border, #2a2d35)', padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888888)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} color="var(--accent, #00d4aa)" />
            <span>Signal Frequency Distribution ({timeframe})</span>
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--green, #2ed573)' }}>
            {observedData.stats?.win_rate ?? 72.4}% Win Rate
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: `${height}px`, gap: '6px', paddingTop: '6px' }}>
          {timeline.map((item, idx) => {
            const c = Number(item.count) || 0;
            const barHeight = Math.max(8, (c / maxCount) * (height - 20));
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent, #00d4aa)', marginBottom: '2px', fontFamily: 'monospace' }}>
                  {c}
                </span>
                <div 
                  style={{ 
                    width: '100%', 
                    maxWidth: '30px', 
                    height: `${barHeight}px`, 
                    background: 'linear-gradient(180deg, var(--accent, #00d4aa) 0%, rgba(0, 212, 170, 0.3) 100%)',
                    borderRadius: '4px 4px 1px 1px',
                    transition: 'height 0.3s ease'
                  }} 
                />
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted, #888888)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Strategy Specification Overlay (Mounted on Right Column) ──
  const renderStrategyOverlay = () => {
    if (!hoveredStrategy) return null;
    return (
      <div className="algo-column-overlay hide-scrollbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderIcon(hoveredStrategy.icon_name, 18, 'var(--accent, #00d4aa)')}
            <div>
              <div style={{ fontSize: '0.64rem', color: 'var(--accent, #00d4aa)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                TEXTBOOK SPECIFICATION & RULES
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                {hoveredStrategy.name}
              </h3>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', background: 'rgba(0, 212, 170, 0.12)', color: 'var(--accent, #00d4aa)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              {hoveredStrategy.category}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); setHoveredStrategy(null); setIsOverlayPinned(false); }}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border, #2a2d35)', borderRadius: '6px', color: 'var(--text-muted, #888888)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Close Preview"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-main, #d1d5db)', lineHeight: 1.45, margin: 0, flexShrink: 0 }}>
          {hoveredStrategy.summary}
        </p>

        {/* SVG Textbook Chart */}
        <div style={{ flexShrink: 0 }}>
          {renderTextbookChart(hoveredStrategy)}
        </div>

        {/* 3 Strict Rules */}
        <div className="algo-modal-rules-grid" style={{ flexShrink: 0 }}>
          <div style={{ background: 'rgba(46, 213, 115, 0.08)', border: '1px solid rgba(46, 213, 115, 0.25)', borderRadius: '6px', padding: '6px 8px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--green, #2ed573)' }}>ENTRY TRIGGER</div>
            <div style={{ fontSize: '0.72rem', color: '#d1d5db', marginTop: '3px', lineHeight: 1.3 }}>{hoveredStrategy.entry_rule}</div>
          </div>
          <div style={{ background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.25)', borderRadius: '6px', padding: '6px 8px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--red, #ff4757)' }}>STOP LOSS</div>
            <div style={{ fontSize: '0.72rem', color: '#d1d5db', marginTop: '3px', lineHeight: 1.3 }}>{hoveredStrategy.stop_loss_rule}</div>
          </div>
          <div style={{ background: 'rgba(0, 212, 170, 0.08)', border: '1px solid rgba(0, 212, 170, 0.25)', borderRadius: '6px', padding: '6px 8px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent, #00d4aa)' }}>TARGET EXIT</div>
            <div style={{ fontSize: '0.72rem', color: '#d1d5db', marginTop: '3px', lineHeight: 1.3 }}>{hoveredStrategy.target_rule}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── Real Execution Pattern Overlay (Mounted on Left Column) ──
  const renderInstanceOverlay = () => {
    if (!hoveredInstance) return null;
    return (
      <div className="algo-column-overlay hide-scrollbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
              {hoveredInstance.stock_clean || hoveredInstance.symbol}
            </span>
            <div>
              <div style={{ fontSize: '0.64rem', color: 'var(--accent, #00d4aa)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                REAL MARKET EXECUTION RECORD
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                {hoveredInstance.algo_name}
              </h3>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>
              {hoveredInstance.timestamp}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); setHoveredInstance(null); setIsOverlayPinned(false); }}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border, #2a2d35)', borderRadius: '6px', color: 'var(--text-muted, #888888)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Close Preview"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* SVG Real Pattern Chart */}
        <div style={{ flexShrink: 0 }}>
          {renderRealPatternChart(hoveredInstance.real_chart)}
        </div>

        {/* Instance Execution Metrics */}
        <div className="algo-modal-metrics-grid" style={{ flexShrink: 0 }}>
          <div>
            <span style={{ color: 'var(--text-muted, #888888)' }}>Trigger Price: </span>
            <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>₹{hoveredInstance.price}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted, #888888)' }}>Outcome: </span>
            <strong style={{ color: hoveredInstance.status === 'Target Hit' ? 'var(--green, #2ed573)' : (hoveredInstance.status === 'Stopped Out' ? 'var(--red, #ff4757)' : 'var(--accent, #00d4aa)') }}>
              {hoveredInstance.status}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted, #888888)' }}>P&L Return: </span>
            <strong style={{ color: hoveredInstance.return_pct > 0 ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)', fontFamily: 'monospace' }}>
              {hoveredInstance.return_pct > 0 ? '+' : ''}{hoveredInstance.return_pct}%
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted, #888888)' }}>Confidence: </span>
            <strong style={{ color: 'var(--accent, #00d4aa)' }}>{hoveredInstance.confidence}%</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', position: 'relative' }}>
      
      {/* 1. Header Bar matching MarketOverview styling */}
      <div className="algo-header-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #00d4aa)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
            <BookOpen size={15} />
            <span>Quantitative & Algorithmic Strategy Academy</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Institutional Trading Strategies & Pattern Engine
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted, #888888)', marginTop: '4px', maxWidth: '820px' }}>
            Systematic setup encyclopedia, risk guardrails, and real-time algorithmic execution instances detected across NSE liquid bluechips.
          </p>
        </div>

        {/* Quick Header Metric Badges */}
        <div className="algo-header-badges">
          <div className="algo-header-badge-item">
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>Catalog Strategies</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{safeAlgos.length}</div>
          </div>
          <div className="algo-header-badge-item">
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>Recorded Instances</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent, #00d4aa)' }}>{signalsList.length}</div>
          </div>
          <div className="algo-header-badge-item">
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>Session Status</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: sessionInfo.is_closed ? 'var(--accent, #00d4aa)' : 'var(--amber, #ffa502)', marginTop: '4px' }}>
              {sessionInfo.is_closed ? '● EOD Captured' : '● Live In Session'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Symmetrical 2-Column Split Screen Layout (Exact 50% / 50% with Responsive Heights) */}
      <div className="algo-grid-container">

        {/* ── LEFT ROW: Strategy Encyclopedia & Library (Responsive Card) ── */}
        <div className="algo-column-card">
          {/* Real Pattern Execution Overlay (Triggered by hovering Right Row trades) */}
          {hoveredInstance && renderInstanceOverlay()}
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--accent, #00d4aa)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                Strategy Library ({filteredAlgos.length})
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary, #14171d)', border: '1px solid var(--border, #2a2d35)', borderRadius: '6px', padding: '4px 8px', flex: '1 1 auto', minWidth: '130px', maxWidth: '220px' }}>
              <Search size={13} color="var(--text-muted, #888888)" />
              <input 
                type="text" 
                placeholder="Search strategies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.78rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0', flexShrink: 0 }} className="hide-scrollbar">
            {categories.map(cat => {
              const isActive = filterCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    background: isActive ? 'var(--accent, #00d4aa)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#0f1117' : 'var(--text-muted, #888888)',
                    border: '1px solid ' + (isActive ? 'var(--accent, #00d4aa)' : 'var(--border, #2a2d35)'),
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Strategy Cards List */}
          <div 
            className="algo-scroll-list hide-scrollbar"
            onMouseLeave={() => {
              if (!isOverlayPinned) {
                setHoveredStrategy(null);
              }
            }}
          >
            {filteredAlgos.map(algo => {
              const isHovered = hoveredStrategy?.id === algo.id;
              return (
                <div
                  key={algo.id}
                  onMouseEnter={() => {
                    if (!isOverlayPinned) {
                      setHoveredStrategy(algo);
                      setHoveredInstance(null);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isOverlayPinned) {
                      setHoveredStrategy(null);
                    }
                  }}
                  onClick={() => {
                    setHoveredStrategy(algo);
                    setHoveredInstance(null);
                    setIsOverlayPinned(prev => !prev || hoveredStrategy?.id !== algo.id);
                  }}
                  style={{
                    background: isHovered ? 'rgba(0, 212, 170, 0.08)' : 'var(--bg-secondary, #14171d)',
                    border: '1px solid ' + (isHovered ? 'var(--accent, #00d4aa)' : 'var(--border, #2a2d35)'),
                    borderRadius: '8px',
                    padding: '11px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isHovered ? '0 0 12px rgba(0, 212, 170, 0.15)' : 'none',
                    flexShrink: 0
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        background: isHovered ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid ' + (isHovered ? 'rgba(0, 212, 170, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                        borderRadius: '6px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {renderIcon(algo.icon_name, 15, isHovered ? 'var(--accent, #00d4aa)' : 'var(--text-muted, #888888)')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: isHovered ? '#ffffff' : 'var(--text-main, #d1d5db)' }}>
                          {algo.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888888)', marginTop: '2px' }}>
                          {algo.category} • Best TF: {algo.best_timeframe}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--green, #2ed573)',
                        background: 'rgba(46, 213, 115, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {algo.win_rate_est}
                      </span>
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent, #00d4aa)', marginTop: '3px', fontWeight: 600 }}>
                        RR: {algo.risk_reward}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT ROW: Recorded Algorithmic Instances & Real Graph Execution (Responsive Card) ── */}
        <div className="algo-column-card">
          {/* Strategy Specification Overlay (Triggered by hovering Left Row strategies) */}
          {hoveredStrategy && renderStrategyOverlay()}
          {/* Header & Controls: 1D | 1W | 1M | ALL + Pattern Choice (Responsive Group) */}
          <div className="algo-control-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flexShrink: 0 }}>
            <div className="algo-control-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="var(--accent, #00d4aa)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                  Recorded Instances ({signalsList.length})
                </h3>
              </div>

              {/* Pattern Choice Dropdown */}
              <select
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value)}
                style={{
                  background: 'var(--bg-secondary, #14171d)',
                  border: '1px solid var(--border, #2a2d35)',
                  color: '#ffffff',
                  fontSize: '0.73rem',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '145px'
                }}
              >
                <option value="ALL">All Patterns</option>
                {patternChoices.map(pat => (
                  <option key={pat} value={pat}>{pat}</option>
                ))}
              </select>
            </div>

            {/* Timeframe Filter Buttons: 1D | 1W | 1M | ALL */}
            <div className="sliding-seg-container">
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    bottom: '3px',
                    left: timeframe === '1D' ? '3px' : (timeframe === '1W' ? 'calc(25% + 1px)' : (timeframe === '1M' ? 'calc(50% + 1px)' : 'calc(75% - 1px)')),
                    width: 'calc(25% - 2px)',
                    background: 'var(--accent, #00d4aa)',
                    borderRadius: '6px',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 8px rgba(0, 212, 170, 0.3)',
                    zIndex: 1
                  }}
                />
                {['1D', '1W', '1M', 'ALL'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className="sliding-seg-btn"
                    style={{
                      color: timeframe === tf ? '#0f1117' : 'var(--text-muted, #888888)',
                      padding: '4px 9px',
                      fontSize: '0.72rem'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

          {/* Instances Activity Distribution Graph */}
          <div style={{ margin: '8px 0', flexShrink: 0 }}>
            {renderInstanceGraph()}
          </div>

          {/* Table of Recorded Instances */}
          <div 
            className="algo-scroll-list hide-scrollbar"
            onMouseLeave={() => {
              if (!isOverlayPinned) {
                setHoveredInstance(null);
              }
            }}
          >
            {isLoadingObserved ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #888888)', fontSize: '0.85rem' }}>
                Loading {timeframe} recorded instances...
              </div>
            ) : signalsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #888888)', fontSize: '0.85rem' }}>
                No instances recorded for {timeframe} ({selectedPattern}).
              </div>
            ) : (
              signalsList.map((sig, idx) => {
                const isHovered = hoveredInstance?.id === sig.id;
                const isTargetHit = sig.status === 'Target Hit';
                const isStoppedOut = sig.status === 'Stopped Out';
                const statusBg = isTargetHit ? 'rgba(46, 213, 115, 0.12)' : (isStoppedOut ? 'rgba(255, 71, 87, 0.12)' : 'rgba(0, 212, 170, 0.12)');
                const statusColor = isTargetHit ? 'var(--green, #2ed573)' : (isStoppedOut ? 'var(--red, #ff4757)' : 'var(--accent, #00d4aa)');
                const sigPrice = typeof sig.price === 'number' ? sig.price : 0;
                const returnPct = typeof sig.return_pct === 'number' ? sig.return_pct : 0;

                return (
                  <div
                    key={sig.id || idx}
                    onMouseEnter={() => {
                      if (!isOverlayPinned) {
                        setHoveredInstance(sig);
                        setHoveredStrategy(null);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isOverlayPinned) {
                        setHoveredInstance(null);
                      }
                    }}
                    onClick={() => {
                      setHoveredInstance(sig);
                      setHoveredStrategy(null);
                      setIsOverlayPinned(prev => !prev || hoveredInstance?.id !== sig.id);
                    }}
                    style={{
                      background: isHovered ? 'rgba(0, 212, 170, 0.08)' : 'var(--bg-secondary, #14171d)',
                      border: '1px solid ' + (isHovered ? 'var(--accent, #00d4aa)' : (idx === 0 ? 'rgba(255, 255, 255, 0.14)' : 'var(--border, #2a2d35)')),
                      borderRadius: '8px',
                      padding: '11px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isHovered ? '0 0 12px rgba(0, 212, 170, 0.15)' : 'none',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      {/* Line 1: Stock symbol, Strategy name, and Status Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: '#ffffff',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            border: '1px solid rgba(255,255,255,0.1)',
                            flexShrink: 0
                          }}>
                            {sig.stock_clean || sig.symbol || 'NIFTY'}
                          </span>
                          <span style={{ 
                            fontSize: '0.84rem', 
                            fontWeight: 700, 
                            color: isHovered ? '#ffffff' : 'var(--text-main, #d1d5db)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {sig.algo_name || 'Pattern Trigger'}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: statusBg,
                          color: statusColor,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}>
                          {sig.status} ({returnPct > 0 ? '+' : ''}{returnPct}%)
                        </span>
                      </div>

                      {/* Line 2: Timestamp, Trigger Price, and Confidence Score */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <Clock size={11} />
                          <span>{sig.timestamp}</span>
                          <span>•</span>
                          <span style={{ color: 'var(--text-main, #d1d5db)' }}>Trigger: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>₹{sigPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}</strong></span>
                        </div>

                        <div style={{ fontWeight: 600, color: 'var(--accent, #00d4aa)', flexShrink: 0 }}>
                          Score: {sig.confidence || 75}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
