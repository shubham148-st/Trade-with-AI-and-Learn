import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Play, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap,
  Info,
  Sliders,
  DollarSign,
  Radio,
  BarChart3,
  Clock,
  Lock,
  Rewind,
  Sun,
  Moon,
  Activity
} from 'lucide-react';

// ─── Mode Definitions ───────────────────────────────────────────────────────
const MODES = [
  { 
    id: 'pre-market', 
    label: 'Pre-Market Discovery', 
    icon: Sun, 
    color: '#f59e0b',
    desc: 'Multi-agent screener ranks alpha candidates before market open',
    locked: false 
  },
  { 
    id: 'live-trading', 
    label: 'Live Trading Signals', 
    icon: Radio, 
    color: '#10b981',
    desc: 'Real-time intraday momentum signals & agent alerts',
    locked: false 
  },
  { 
    id: 'post-market', 
    label: 'Post-Market Analysis', 
    icon: BarChart3, 
    color: '#8b5cf6',
    desc: 'End-of-day review, agent accuracy audit & next-day prep',
    locked: false 
  },
  { 
    id: 'time-machine', 
    label: 'Time Machine', 
    icon: Rewind, 
    color: '#6b7280',
    desc: 'Replay full-day data with simulated agents on historical dates',
    locked: true 
  },
];

// ─── Auto-detect mode from IST market hours ─────────────────────────────────
function detectMarketMode() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const day = ist.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const mins = ist.getHours() * 60 + ist.getMinutes();

  if (!isWeekday) return 'post-market';
  if (mins >= 510 && mins < 555) return 'pre-market';   // 08:30 – 09:14
  if (mins >= 555 && mins <= 930) return 'live-trading'; // 09:15 – 15:30
  return 'post-market';                                   // before 08:30 or after 15:30
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AICommandCenter({ 
  selectedSymbol, 
  onSelectSymbol, 
  onNavigateToAlgo,
  onSendToPaperTrading,
  watchlist = [],
  onToggleWatchlist
}) {
  const [activeMode, setActiveMode] = useState(() => detectMarketMode());
  const [isScanning, setIsScanning] = useState(false);
  const [rankedList, setRankedList] = useState([]);
  const [detailData, setDetailData] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [agentProgress, setAgentProgress] = useState({ news: 0, hist: 0, strat: 0 });

  // Load detail when selectedSymbol changes
  useEffect(() => {
    if (selectedSymbol) {
      loadStockFullDetail(selectedSymbol);
    }
  }, [selectedSymbol]);

  const runDiscoveryScan = async () => {
    setIsScanning(true);
    setAgentProgress({ news: 20, hist: 10, strat: 15 });

    const timer = setInterval(() => {
      setAgentProgress(prev => ({
        news: Math.min(prev.news + 15, 90),
        hist: Math.min(prev.hist + 12, 90),
        strat: Math.min(prev.strat + 14, 90)
      }));
    }, 400);

    try {
      const res = await fetch('/api/analysis/scan');
      const data = await res.json();
      clearInterval(timer);
      setAgentProgress({ news: 100, hist: 100, strat: 100 });
      setRankedList(data);
      if (data.length > 0 && !selectedSymbol) {
        onSelectSymbol(data[0].symbol);
      }
    } catch (e) {
      clearInterval(timer);
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const loadStockFullDetail = async (sym) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/analysis/full/${sym}`);
      const data = await res.json();
      setDetailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const currentMode = MODES.find(m => m.id === activeMode) || MODES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ═══ Mode Selector Bar ═══ */}
      <div style={{
        background: 'linear-gradient(145deg, var(--bg-card), #161b2a)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent), #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={20} color="#0a0d14" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>AI Command Center</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Multi-agent intelligence • {currentMode.desc}
              </div>
            </div>
          </div>

          {/* Auto-detect badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
          }}>
            <Clock size={12} />
            Mode auto-detected from IST market hours
          </div>
        </div>

        {/* Mode Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {MODES.map(mode => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => !mode.locked && setActiveMode(mode.id)}
                disabled={mode.locked}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: isActive 
                    ? `1.5px solid ${mode.color}` 
                    : '1px solid var(--border)',
                  background: isActive 
                    ? `${mode.color}18` 
                    : mode.locked 
                      ? 'rgba(255,255,255,0.02)' 
                      : 'var(--bg-secondary)',
                  color: isActive ? mode.color : mode.locked ? 'var(--text-muted)' : 'var(--text-main)',
                  cursor: mode.locked ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 600,
                  transition: 'all 0.2s',
                  opacity: mode.locked ? 0.5 : 1,
                  position: 'relative',
                }}
              >
                <Icon size={15} />
                {mode.label}
                {mode.locked && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'rgba(107, 114, 128, 0.25)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#9ca3af',
                  }}>
                    <Lock size={9} /> SOON
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Mode Content ═══ */}

      {activeMode === 'pre-market' && (
        <PreMarketMode
          isScanning={isScanning}
          agentProgress={agentProgress}
          rankedList={rankedList}
          detailData={detailData}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
          onNavigateToAlgo={onNavigateToAlgo}
          onSendToPaperTrading={onSendToPaperTrading}
          runDiscoveryScan={runDiscoveryScan}
          watchlist={watchlist}
          onToggleWatchlist={onToggleWatchlist}
        />
      )}

      {activeMode === 'live-trading' && (
        <PlaceholderMode
          icon={Radio}
          color="#10b981"
          title="Live Trading Signals"
          subtitle="Real-time agent-driven intraday intelligence"
          bullets={[
            'Agents monitor live price action, volume spikes & order flow anomalies',
            'Instant alerts when breakout/breakdown conditions trigger across your watchlist',
            'Real-time confidence scores updated every 30 seconds during market hours',
            'One-click send to Paper Trading with pre-filled entry, SL & targets',
          ]}
        />
      )}

      {activeMode === 'post-market' && (
        <PlaceholderMode
          icon={BarChart3}
          color="#8b5cf6"
          title="Post-Market Analysis"
          subtitle="Same agents, future-looking — end-of-day intelligence for tomorrow"
          bullets={[
            'Agents replay today\'s data to score prediction accuracy & refine models',
            'End-of-day P&L attribution: which agent signals won, which missed',
            'Next-day prep: overnight gap risk, earnings calendar, sector rotation signals',
            'Generates pre-market watchlist candidates for the next trading session',
          ]}
        />
      )}

      {activeMode === 'time-machine' && (
        <PlaceholderMode
          icon={Rewind}
          color="#6b7280"
          title="Time Machine"
          subtitle="Replay any historical trading day with full agent simulation"
          bullets={[
            'Pick any past date and watch all 3 agents process that day\'s data in real-time',
            'Compare agent predictions vs actual outcomes with detailed accuracy metrics',
            'Practice your decision-making without risking capital on live markets',
            'Export simulation reports for strategy backtesting and journaling',
          ]}
          locked
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-MARKET MODE (preserves all existing AIAnalysis logic)
// ═══════════════════════════════════════════════════════════════════════════════
function PreMarketMode({
  isScanning,
  agentProgress,
  rankedList,
  detailData,
  selectedSymbol,
  onSelectSymbol,
  onNavigateToAlgo,
  onSendToPaperTrading,
  runDiscoveryScan,
  watchlist,
  onToggleWatchlist,
}) {
  return (
    <>
      {/* Pre-Market Discovery Controller */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.02))',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
            <Sparkles size={16} /> PRE-MARKET QUANT DISCOVERY (8:30 AM ONWARDS)
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Multi-Agent Algorithmic Screener</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Spins up 3 parallel autonomous agents (News NLP, Historical Volume/Price Action, Strategy Signals) 
            to screen 50+ stocks and rank institutional alpha candidates.
          </p>
        </div>

        <button
          onClick={runDiscoveryScan}
          disabled={isScanning}
          style={{
            background: 'linear-gradient(135deg, var(--accent), #10b981)',
            color: '#0a0d14',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px var(--accent-glow)',
            cursor: isScanning ? 'wait' : 'pointer',
          }}
        >
          {isScanning ? (
            <>Analyzing Stocks in Parallel...</>
          ) : (
            <>
              <Play size={18} fill="#0a0d14" /> Start Multi-Agent Analysis
            </>
          )}
        </button>
      </div>

      {/* Progress Monitor when Scanning */}
      {isScanning && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { name: 'Agent 1 — News Intelligence', progress: agentProgress.news, role: 'NLP Sentiment & Event Risk' },
            { name: 'Agent 2 — Historical Engine', progress: agentProgress.hist, role: 'EMA, VWAP & Volatility Bands' },
            { name: 'Agent 3 — Strategy Execution', progress: agentProgress.strat, role: 'Breakout, Hammer, RSI & MACD' },
          ].map((ag, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{ag.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{ag.role}</div>
              <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ag.progress}%`, background: 'var(--accent)', transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard + Full Technical Deep Dive */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        
        {/* Left: Ranked Leaderboard */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '850px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Ranked Alpha Candidates</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {rankedList.length > 0 ? `${rankedList.length} screened` : 'Click Start to Screen'}
            </span>
          </div>

          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rankedList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Bot size={36} color="var(--border)" style={{ marginBottom: '0.5rem' }} />
                <div>No active ranking yet.</div>
                <div style={{ fontSize: '0.75rem' }}>Click "Start Multi-Agent Analysis" above to screen.</div>
              </div>
            ) : (
              rankedList.map((stk, idx) => {
                const isSelected = selectedSymbol === stk.symbol;
                const rawSym = stk.symbol?.replace('.NS', '');
                const isWatchlisted = watchlist.includes(stk.symbol) || watchlist.includes(rawSym);
                return (
                  <div
                    key={stk.symbol}
                    onClick={() => onSelectSymbol(stk.symbol)}
                    style={{
                      background: isSelected ? 'rgba(0, 229, 179, 0.08)' : 'var(--bg-secondary)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {onToggleWatchlist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(stk.symbol);
                          }}
                          title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isWatchlisted ? '#fbbf24' : '#4b5563',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            padding: '2px',
                            lineHeight: 1
                          }}
                        >
                          {isWatchlisted ? '★' : '☆'}
                        </button>
                      )}
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx < 3 ? 'var(--accent)' : 'var(--border)',
                        color: idx < 3 ? '#0a0d14' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{stk.symbol.replace('.NS', '')}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stk.name}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score</div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)' }}>{stk.overall}/100</div>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: stk.signal === 'buy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: stk.signal === 'buy' ? 'var(--green)' : 'var(--amber)'
                      }}>
                        {stk.signal?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Stock Intelligence Panel */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {!detailData ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              Select a stock from the left or market overview to open deep analysis.
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{detailData.name}</h2>
                    {onToggleWatchlist && (
                      <button
                        onClick={() => onToggleWatchlist(detailData.symbol)}
                        title="Toggle Watchlist"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.3rem',
                          color: (watchlist.includes(detailData.symbol) || watchlist.includes(detailData.symbol?.replace('.NS', ''))) ? '#fbbf24' : '#6b7280',
                          padding: '0 4px',
                          lineHeight: 1
                        }}
                      >
                        {(watchlist.includes(detailData.symbol) || watchlist.includes(detailData.symbol?.replace('.NS', ''))) ? '★' : '☆'}
                      </button>
                    )}
                    <span style={{ background: 'var(--border)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {detailData.symbol}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Consensus Strategy Signal: <strong style={{ color: 'var(--accent)' }}>{detailData.strategy?.signal?.toUpperCase()}</strong> ({detailData.strategy?.confidence}% Confidence)
                  </div>
                </div>

                {/* Instant Send to Paper Trading CTA */}
                <button
                  onClick={() => onSendToPaperTrading({
                    symbol: detailData.symbol,
                    price: detailData.chart_data?.slice(-1)[0]?.close || 1000,
                    stop_loss: detailData.strategy?.stop_loss,
                    target: detailData.strategy?.targets?.[0],
                    algo_name: detailData.patterns?.[0]?.name || "Multi-Agent Consensus"
                  })}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--green)',
                    border: '1px solid var(--green)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <DollarSign size={16} /> Paper Trade this Signal
                </button>
              </div>

              {/* 3 Pillars Score Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Overall Alpha', val: detailData.scores?.overall, color: 'var(--accent)' },
                  { label: 'News Intelligence', val: detailData.scores?.news, color: '#38bdf8' },
                  { label: 'Historical Trend', val: detailData.scores?.history, color: '#a855f7' },
                  { label: 'Strategy Quant', val: detailData.scores?.strategy, color: '#ec4899' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.val}/100</div>
                  </div>
                ))}
              </div>

              {/* Observed Algos & Interactive Redirect Tooltips */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <Zap size={16} color="var(--amber)" />
                  Observed Algorithmic Patterns (Click to Learn What It Is)
                </div>

                {(!detailData.patterns || detailData.patterns.length === 0) ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Standard moving average consolidation; no extreme candlestick anomaly detected.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {detailData.patterns.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => onNavigateToAlgo(p.algo_id)}
                        title={`Click to read complete beginner guide and trading rules for ${p.name}`}
                        style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{p.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({p.date})</span>
                        <HelpCircle size={14} color="var(--amber)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Technical Execution Levels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUGGESTED ENTRY ZONE</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent)', marginTop: '4px' }}>
                    ₹{detailData.strategy?.entry_zone ? `${detailData.strategy.entry_zone[0]} - ${detailData.strategy.entry_zone[1]}` : 'Market Price'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STRICT STOP LOSS</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--red)', marginTop: '4px' }}>
                    ₹{detailData.strategy?.stop_loss ?? '—'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TAKE PROFIT (T1 / T2)</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green)', marginTop: '4px' }}>
                    ₹{detailData.strategy?.targets?.slice(0, 2)?.join(' / ') ?? '—'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RISK : REWARD</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginTop: '4px' }}>
                    1 : {detailData.strategy?.risk_reward ?? '2.0'}
                  </div>
                </div>
              </div>

              {/* News Highlights */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Agent 1 Recent Headlines:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {detailData.news?.articles?.slice(0, 3)?.map((art, i) => (
                    <div key={i}>• {art.title} ({art.sentiment})</div>
                  )) || <div>No news parsed yet.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER MODE (reusable for Live, Post-Market, Time Machine)
// ═══════════════════════════════════════════════════════════════════════════════
function PlaceholderMode({ icon: Icon, color, title, subtitle, bullets, locked = false }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${locked ? 'var(--border)' : `${color}33`}`,
      borderRadius: '12px',
      padding: '3rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '1.25rem',
      minHeight: '400px',
      justifyContent: 'center',
    }}>
      {/* Icon Circle */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: `${color}15`,
        border: `2px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={28} color={color} />
      </div>

      {/* Title */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px 0' }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, maxWidth: '500px' }}>{subtitle}</p>
      </div>

      {/* Status Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        background: locked ? 'rgba(107, 114, 128, 0.15)' : `${color}18`,
        border: `1px solid ${locked ? 'rgba(107, 114, 128, 0.3)' : `${color}40`}`,
        fontSize: '0.78rem',
        fontWeight: 700,
        color: locked ? '#9ca3af' : color,
      }}>
        {locked ? <><Lock size={13} /> Coming Soon</> : <><Activity size={13} /> Under Development</>}
      </div>

      {/* Feature Bullets */}
      <div style={{
        textAlign: 'left',
        maxWidth: '520px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '0.5rem',
      }}>
        {bullets.map((b, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: `${color}18`,
              border: `1px solid ${color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 800,
              color: color,
              flexShrink: 0,
              marginTop: '1px',
            }}>
              {i + 1}
            </span>
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}
