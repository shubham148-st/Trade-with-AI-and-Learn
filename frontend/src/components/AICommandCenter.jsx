import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Play,
  Sparkles,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Zap,
  DollarSign,
  Radio,
  BarChart3,
  Clock,
  Lock,
  Sun,
  Activity,
  ArrowLeft,
  ArrowRight,
  Loader,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Star,
  Newspaper,
  Layers,
  BarChart2,
  Sliders,
  Compass,
  ArrowUpRight
} from 'lucide-react';

// ─── Storage Keys for Session/Daily Logging ─────────────────────────────────
const STORAGE_SCAN_KEY = 'tail_ai_premarket_scan_v1';
const STORAGE_SCAN_DATE_KEY = 'tail_ai_premarket_scan_date_v1';

// ─── IST Market Hours Utility ────────────────────────────────────────────────
function getISTNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}

function getMarketState() {
  const ist = getISTNow();
  const day = ist.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const mins = ist.getHours() * 60 + ist.getMinutes();

  if (isWeekday && mins >= 555 && mins <= 930) return 'live';
  if (isWeekday && mins > 930 && mins <= 960) return 'analyzing';
  return 'closed';
}

function resolveInitialMode() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const full = path || hash;
  if (full.includes('/ai/pre') || full.includes('#/ai/pre')) return 'pre-market';
  if (full.includes('/ai/live') || full.includes('#/ai/live')) return 'live-trading';
  if (full.includes('/ai/post') || full.includes('#/ai/post')) return 'post-market';
  return null;
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
  const [activeMode, setActiveMode] = useState(() => resolveInitialMode());
  const [marketState, setMarketState] = useState(getMarketState);

  useEffect(() => {
    const handlePop = () => {
      const mode = resolveInitialMode();
      setActiveMode(mode);
    };
    window.addEventListener('popstate', handlePop);
    window.addEventListener('hashchange', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('hashchange', handlePop);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setMarketState(getMarketState()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectMode = (mode) => {
    setActiveMode(mode);
    const sub = mode === 'pre-market' ? 'pre' : mode === 'live-trading' ? 'live' : 'post';
    try {
      window.history.pushState({}, '', `/AI/${sub}`);
    } catch {
      window.location.hash = `#/AI/${sub}`;
    }
  };

  const goToLanding = () => {
    setActiveMode(null);
    try {
      window.history.pushState({}, '', `/AI`);
    } catch {
      window.location.hash = `#/AI`;
    }
  };

  if (activeMode === null) {
    return (
      <LandingPage
        marketState={marketState}
        onSelectMode={handleSelectMode}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <button
        onClick={goToLanding}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '2px 0',
          alignSelf: 'flex-start',
        }}
      >
        <ArrowLeft size={15} /> Back to AI Command Center
      </button>

      {activeMode === 'pre-market' && (
        <PreMarketPage
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
          watchlist={watchlist}
          onToggleWatchlist={onToggleWatchlist}
          onNavigateToAlgo={onNavigateToAlgo}
        />
      )}

      {activeMode === 'live-trading' && (
        <LiveTradingPage
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
          onSendToPaperTrading={onSendToPaperTrading}
          watchlist={watchlist}
          onToggleWatchlist={onToggleWatchlist}
        />
      )}

      {activeMode === 'post-market' && (
        <PostMarketPage
          marketState={marketState}
          onNavigateToAlgo={onNavigateToAlgo}
          watchlist={watchlist}
          onToggleWatchlist={onToggleWatchlist}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPage({ marketState, onSelectMode }) {
  const isLive = marketState === 'live';
  const isAnalyzing = marketState === 'analyzing';
  const isClosed = marketState === 'closed';

  const preMarketAvailable = isClosed;
  const liveAvailable = isLive;
  const postMarketAvailable = !isAnalyzing;

  const modes = [
    {
      id: 'pre-market',
      label: 'Pre-Market Discovery',
      icon: Sun,
      color: '#00d4aa',
      available: preMarketAvailable,
      desc: 'Tri-modal quant screener evaluates institutional alpha candidates, network news sentiment, and risk guardrails.',
      statusText: preMarketAvailable ? 'Available (Market Closed)' : isLive ? 'Unlocks at 15:30 IST' : 'Analysis In Progress',
      features: [
        'Tri-Modal Multi-Agent Consensus (News, Historical, Strategy)',
        'Ranked Opportunity & Risk Screener with Pinned Wishlist',
        'Persistent Session Logging & Live News RSS Engine',
      ],
    },
    {
      id: 'live-trading',
      label: 'Live Trading Signals',
      icon: Radio,
      color: '#2ed573',
      available: liveAvailable,
      desc: 'Real-time intraday momentum screener with RSI, VWAP and volume spike triggers active during market hours.',
      statusText: liveAvailable ? 'LIVE (09:15 – 15:30 IST)' : 'Market Closed',
      features: [
        'Real-time intraday momentum indicators',
        'VWAP rejection and RSI signal triggers',
        'Direct routing to Virtual Paper Trading',
      ],
    },
    {
      id: 'post-market',
      label: 'Post-Market Analysis',
      icon: BarChart3,
      color: '#a855f7',
      available: postMarketAvailable,
      desc: 'Comprehensive post-close review of detected algorithmic formations, pattern hit rates, and next-day setups.',
      statusText: isAnalyzing ? 'Analysis Running...' : 'Available',
      features: [
        'Observed algorithmic formations & signatures',
        'Learner Academy strategy explanations & rules',
        'Daily session audit and sentiment review',
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Professional Command Hub Header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'var(--bg-bar)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bot size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
              AI Command Center
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Institutional Intelligence & Multi-Agent Execution Framework
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-bar)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          fontSize: '0.75rem',
        }}>
          <Clock size={13} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)' }}>Market Session:</span>
          <span style={{
            fontWeight: 700,
            color: isLive ? 'var(--green)' : isAnalyzing ? 'var(--amber)' : 'var(--text-muted)',
          }}>
            {isLive ? 'NSE Live Session' : isAnalyzing ? 'Post-Market Syncing' : 'Closed / Off-Hours'}
          </span>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1rem' }}>
        {modes.map(mode => {
          const Icon = mode.icon;
          return (
            <div
              key={mode.id}
              onClick={() => mode.available && onSelectMode(mode.id)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.25rem',
                cursor: mode.available ? 'pointer' : 'not-allowed',
                opacity: mode.available ? 1 : 0.6,
                transition: 'border-color 0.15s, transform 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
              onMouseEnter={(e) => {
                if (mode.available) {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '6px',
                    background: 'var(--bg-bar)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={18} color={mode.color} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>{mode.label}</div>
                </div>

                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: mode.available ? 'var(--text-main)' : 'var(--text-muted)',
                  background: 'var(--bg-bar)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {!mode.available && <Lock size={10} />}
                  {mode.statusText}
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                {mode.desc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid rgba(42, 45, 53, 0.5)' }}>
                {mode.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <ChevronRight size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              {mode.available && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Open Module <ArrowRight size={13} />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// PRE-MARKET PAGE — Professional Tri-Modal Screener & Detailed Breakdown
// ═══════════════════════════════════════════════════════════════════════════════
function PreMarketPage({ selectedSymbol, onSelectSymbol, watchlist = [], onToggleWatchlist, onNavigateToAlgo }) {
  const [isScanning, setIsScanning] = useState(false);
  const [rankedList, setRankedList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SCAN_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [scanDate, setScanDate] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_SCAN_DATE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [agentProgress, setAgentProgress] = useState({ news: 0, hist: 0, strat: 0 });
  const [activeStock, setActiveStock] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadDetail = async (sym) => {
    if (!sym) return;
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/analysis/full/${sym}`);
      const data = await res.json();
      setDetailData(data);
    } catch (e) {
      console.error('Failed to load stock analysis detail', e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (rankedList.length > 0 && !activeStock) {
      const first = rankedList[0].symbol;
      setActiveStock(first);
      loadDetail(first);
    }
  }, [rankedList]);

  // Toggle selection: click opens details, clicking again closes/hides details
  const handleSelect = (sym) => {
    if (activeStock === sym) {
      setActiveStock(null);
      setDetailData(null);
      if (onSelectSymbol) onSelectSymbol(null);
    } else {
      setActiveStock(sym);
      if (onSelectSymbol) onSelectSymbol(sym);
      loadDetail(sym);
    }
  };

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
      const list = Array.isArray(data) ? data : [];
      setRankedList(list);
      const todayStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      setScanDate(todayStr);

      try {
        localStorage.setItem(STORAGE_SCAN_KEY, JSON.stringify(list));
        localStorage.setItem(STORAGE_SCAN_DATE_KEY, todayStr);
      } catch (err) {
        console.warn('LocalStorage error', err);
      }

      if (list.length > 0) {
        handleSelect(list[0].symbol);
      }
    } catch (e) {
      clearInterval(timer);
      console.error('Pre-market scan failed', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Sort: Wishlisted stocks ALWAYS appear above all numbered stocks
  const sortedStocks = useMemo(() => {
    if (!rankedList || rankedList.length === 0) return [];
    const isW = (sym) => {
      const raw = sym.replace('.NS', '');
      return watchlist.includes(sym) || watchlist.includes(raw);
    };

    const wishlisted = rankedList.filter(s => isW(s.symbol));
    const others = rankedList.filter(s => !isW(s.symbol));
    return [...wishlisted, ...others];
  }, [rankedList, watchlist]);

  return (
    <>
      {/* Top Controller Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Sparkles size={13} /> Tri-Modal Quant Screener
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '2px 0 0 0', color: '#ffffff' }}>
            Pre-Market Opportunity & Risk Screener
          </h2>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {scanDate ? `Last log: ${scanDate} IST` : 'No log in session. Start scan below.'}
          </div>
        </div>

        <button
          onClick={runDiscoveryScan}
          disabled={isScanning}
          style={{
            background: 'var(--accent)',
            color: '#0f1117',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isScanning ? 'wait' : 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          {isScanning ? (
            <><Loader size={14} className="spin" /> Scanning Stocks...</>
          ) : rankedList.length > 0 ? (
            <><RefreshCw size={14} /> Refresh Analysis</>
          ) : (
            <><Play size={14} fill="#0f1117" /> Start Multi-Agent Analysis</>
          )}
        </button>
      </div>

      {/* Progress Bars */}
      {isScanning && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[
            { name: 'Agent 1: News & Network Risk', progress: agentProgress.news, role: 'Live RSS, Regulatory Scrutiny & Sentiment' },
            { name: 'Agent 2: Historical Trend', progress: agentProgress.hist, role: 'EMA Alignment & Volatility Bands' },
            { name: 'Agent 3: Strategy Quant', progress: agentProgress.strat, role: 'Candlestick Formations & Momentum Score' },
          ].map((ag, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{ag.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{ag.role}</div>
              <div style={{ height: '4px', background: 'var(--bg-bar)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ag.progress}%`, background: 'var(--accent)', transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Responsive Screener Layout Grid */}
      <div className="ai-layout-grid">
        
        {/* Left Column: Fixed Width, Strict Single-Line Rows, Clean Padding */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '850px'
        }}>
          {/* List Sub-Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 6px 8px 6px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>Trading Candidates</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>{sortedStocks.length} logged</span>
          </div>

          {/* Strict Column Headers for Perfect Professional Alignment */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '18px 22px minmax(70px, 1fr) 48px 62px',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '4px'
          }}>
            <span></span>
            <span style={{ textAlign: 'center' }}>#</span>
            <span>Asset</span>
            <span style={{ textAlign: 'right' }}>Score</span>
            <span style={{ textAlign: 'center' }}>Setup</span>
          </div>

          {/* Candidate Items */}
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '2px' }}>
            {sortedStocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Bot size={32} color="var(--border)" style={{ marginBottom: '0.5rem' }} />
                <div>No active screener log.</div>
                <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>Click "Start Multi-Agent Analysis" above.</div>
              </div>
            ) : (
              sortedStocks.map((stk, idx) => {
                const isSelected = activeStock === stk.symbol;
                const rawSym = stk.symbol?.replace('.NS', '');
                const isWishlisted = watchlist.includes(stk.symbol) || watchlist.includes(rawSym);

                // Strict Single-Word Opportunity Badge: High, Moderate, Low
                let oppTag = 'MODERATE';
                let tagColor = 'var(--amber, #ffa502)';
                let tagBg = 'rgba(255, 165, 2, 0.1)';
                let tagBorder = 'rgba(255, 165, 2, 0.25)';

                if (stk.overall >= 70) {
                  oppTag = 'HIGH';
                  tagColor = 'var(--green, #2ed573)';
                  tagBg = 'rgba(46, 213, 115, 0.1)';
                  tagBorder = 'rgba(46, 213, 115, 0.25)';
                } else if (stk.overall < 50 || stk.risk_flags > 0) {
                  oppTag = 'LOW';
                  tagColor = 'var(--red, #ff4757)';
                  tagBg = 'rgba(255, 71, 87, 0.1)';
                  tagBorder = 'rgba(255, 71, 87, 0.25)';
                }

                return (
                  <React.Fragment key={stk.symbol}>
                    <div
                      className="ai-candidate-row"
                      onClick={() => handleSelect(stk.symbol)}
                      style={{
                        background: isSelected ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                        border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                      }}
                    >
                      {/* 1. Star Pin */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(stk.symbol);
                        }}
                        title={isWishlisted ? 'Unpin stock' : 'Pin to top of list'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isWishlisted ? 'var(--amber)' : '#4b5563',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          padding: 0,
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isWishlisted ? '★' : '☆'}
                      </button>

                      {/* 2. Rank / Index badge */}
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        background: isWishlisted ? 'rgba(255, 165, 2, 0.15)' : 'var(--bg-bar)',
                        color: isWishlisted ? 'var(--amber)' : 'var(--text-muted)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isWishlisted ? '★' : idx + 1}
                      </span>

                      {/* 3. Ticker symbol & small company name */}
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rawSym}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {stk.name}
                        </div>
                      </div>

                      {/* 4. Score */}
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', fontFamily: 'var(--font-mono, monospace)', color: isSelected ? 'var(--accent)' : '#ffffff' }}>
                          {stk.overall}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: 1 }}>Score</div>
                      </div>

                      {/* 5. Opportunity Tag: Strict Single Row Alignment (HIGH, MODERATE, LOW) */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '58px',
                          textAlign: 'center',
                          padding: '2px 0',
                          borderRadius: '4px',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono, monospace)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                          color: tagColor,
                          background: tagBg,
                          border: `1px solid ${tagBorder}`
                        }}>
                          {oppTag}
                        </span>
                      </div>
                    </div>

                    {/* Small screens inline accordion: Unwraps right below selected stock */}
                    {isSelected && (
                      <div className="ai-inline-accordion">
                        {isLoadingDetail ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            <Loader size={18} className="spin" style={{ marginBottom: '0.35rem' }} />
                            <div>Loading multi-agent intelligence...</div>
                          </div>
                        ) : detailData ? (
                          <StockIntelligenceView
                            data={detailData}
                            watchlist={watchlist}
                            onToggleWatchlist={onToggleWatchlist}
                            onNavigateToAlgo={onNavigateToAlgo}
                          />
                        ) : null}
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Technical Execution & Detailed Intelligence (Desktop only) */}
        <div className="ai-desktop-detail-panel" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {isLoadingDetail ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              <Loader size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
              <div>Fetching Multi-Agent Reports & Verified Brand News...</div>
            </div>
          ) : !detailData ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              Select a stock from the candidate list to view institutional trade levels & network reports.
            </div>
          ) : (
            <StockIntelligenceView
              data={detailData}
              watchlist={watchlist}
              onToggleWatchlist={onToggleWatchlist}
              onNavigateToAlgo={onNavigateToAlgo}
            />
          )}
        </div>
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// STOCK INTELLIGENCE VIEW (Right Panel)
// ═══════════════════════════════════════════════════════════════════════════════
function StockIntelligenceView({ data, watchlist, onToggleWatchlist, onNavigateToAlgo }) {
  const rawSym = data.symbol?.replace('.NS', '');
  const isWishlisted = watchlist.includes(data.symbol) || watchlist.includes(rawSym);

  const scores = data.scores || {};
  const news = data.news || {};
  const articles = news.articles || [];
  const riskFlags = news.risk_flags || [];
  const patterns = data.patterns || [];

  return (
    <>
      {/* Brand Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{data.name}</h2>
            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(data.symbol)}
                title={isWishlisted ? 'Unpin stock' : 'Pin to top of list'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: isWishlisted ? 'var(--amber)' : '#4b5563',
                  padding: '0 2px',
                  lineHeight: 1
                }}
              >
                {isWishlisted ? '★' : '☆'}
              </button>
            )}
            <span style={{ background: 'var(--bg-bar)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {data.symbol}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Tri-Modal Score: <strong style={{ color: 'var(--accent)' }}>{scores.overall ?? 50}/100</strong> • Scrutiny Risk: <strong style={{ color: riskFlags.length > 0 ? 'var(--red)' : 'var(--green)' }}>{riskFlags.length > 0 ? 'Elevated' : 'Controlled'}</strong>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-bar)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '4px 10px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Setup Quality</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)' }}>
            {data.strategy?.confidence ? `${data.strategy.confidence}% Confidence` : 'Consensus Active'}
          </div>
        </div>
      </div>

      {/* Per-Agent Score Breakdown */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="var(--accent)" /> Per-Agent Multi-Modal Contribution
        </div>
        <div className="ai-metrics-grid">
          {[
            { label: 'Consensus Score', val: scores.overall ?? 50, color: 'var(--accent)', weight: 'Tri-Modal' },
            { label: 'Agent 1: News & Risk', val: scores.news ?? 50, color: '#38bdf8', weight: '25% Weight' },
            { label: 'Agent 2: Historical Trend', val: scores.history ?? 50, color: '#a855f7', weight: '35% Weight' },
            { label: 'Agent 3: Strategy Quant', val: scores.strategy ?? 50, color: '#ec4899', weight: '40% Weight' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-bar)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: s.color, marginTop: '2px' }}>{s.val}/100</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>{s.weight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Levels with Verified R:R (e.g. 1 : 2.0) */}
      <div style={{
        background: 'var(--bg-bar)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.9rem'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.65rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={14} color="var(--amber)" /> Execution Levels & Day-Trade Guardrails
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ENTRY ZONE</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent)', marginTop: '2px' }}>
              ₹{data.strategy?.entry_zone ? `${data.strategy.entry_zone[0]} - ${data.strategy.entry_zone[1]}` : 'Market Price'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CALCULATED STOP LOSS</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--red)', marginTop: '2px' }}>
              ₹{data.strategy?.stop_loss ?? '—'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PROFIT TARGET (T1 / T2)</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--green)', marginTop: '2px' }}>
              ₹{data.strategy?.targets?.slice(0, 2)?.join(' / ') ?? '—'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>RISK : REWARD PROFILE</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--green)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
              {data.strategy?.risk_reward || '1 : 2.0'}
            </div>
            {data.strategy?.risk_amount != null && data.strategy?.reward_amount != null && (
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                ₹{data.strategy.risk_amount} Risk / ₹{data.strategy.reward_amount} Target
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Formations Observed (Active + Past formations, redirecting to Algo Academy) */}
      <div style={{
        background: 'var(--bg-bar)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.9rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
            <Zap size={14} color="var(--amber)" /> Observed Algorithmic Formations & Candlestick Signatures
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Click to view strategy rules</span>
        </div>

        {patterns.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No distinct candlestick or algorithmic formations detected in recent sessions.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
            {patterns.map((p, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateToAlgo && onNavigateToAlgo(p.algo_id)}
                title={`Click to read complete beginner guide and trading rules for ${p.name}`}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--amber)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--amber)' }}>{p.name}</div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', background: 'var(--bg-bar)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border)' }}>
                    {p.badge || 'Quant'}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#ffffff', fontWeight: 600 }}>
                  {p.status || p.timing || p.date}
                </div>
                {p.explanation && (
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    {p.explanation}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginTop: '2px', color: 'var(--amber)', fontSize: '0.68rem', fontWeight: 700 }}>
                  Algo Academy <ArrowUpRight size={11} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Risk Audit */}
      <div style={{
        background: riskFlags.length > 0 ? 'rgba(255, 71, 87, 0.08)' : 'rgba(46, 213, 115, 0.06)',
        border: `1px solid ${riskFlags.length > 0 ? 'rgba(255, 71, 87, 0.25)' : 'rgba(46, 213, 115, 0.2)'}`,
        borderRadius: '6px',
        padding: '0.85rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: riskFlags.length > 0 ? 'var(--red)' : 'var(--green)', marginBottom: '4px' }}>
          {riskFlags.length > 0 ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
          Network Risk & Corporate Scrutiny Audit
        </div>

        {riskFlags.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.75rem', color: '#fca5a5' }}>
            <div style={{ fontWeight: 600 }}>Detected high-severity keywords in media network:</div>
            {riskFlags.map((flag, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span>•</span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No investigations, defaults, lawsuits or high-severity risk reports registered across the media network.
          </div>
        )}
      </div>

      {/* Real Verified Brand News Feed */}
      <div style={{
        background: 'var(--bg-bar)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.9rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
            <Newspaper size={15} color="var(--accent)" />
            Verified Brand News & Market Network Reports ({articles.length})
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Sentiment: <strong style={{ color: news.sentiment === 'positive' ? 'var(--green)' : news.sentiment === 'negative' ? 'var(--red)' : 'var(--text-main)', textTransform: 'capitalize' }}>{news.sentiment || 'Neutral'}</strong>
          </span>
        </div>

        {articles.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.25rem' }}>
            No recent brand news items indexed for this symbol.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {articles.map((art, idx) => {
              const isPos = art.sentiment === 'positive';
              const isNeg = art.sentiment === 'negative';
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.35 }}>
                      {art.link ? (
                        <a
                          href={art.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                        >
                          {art.title} <ExternalLink size={11} color="var(--text-muted)" />
                        </a>
                      ) : (
                        art.title
                      )}
                    </div>

                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: isPos ? 'rgba(46, 213, 115, 0.12)' : isNeg ? 'rgba(255, 71, 87, 0.12)' : 'var(--bg-bar)',
                      color: isPos ? 'var(--green)' : isNeg ? 'var(--red)' : 'var(--text-muted)',
                      border: `1px solid ${isPos ? 'rgba(46, 213, 115, 0.25)' : isNeg ? 'rgba(255, 71, 87, 0.25)' : 'var(--border)'}`
                    }}>
                      {art.sentiment?.toUpperCase() || 'NEUTRAL'} ({art.score ?? 50})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {(art.publisher || art.source) && (
                      <span>Source: <strong style={{ color: 'var(--text-main)' }}>{art.publisher || art.source}</strong></span>
                    )}
                    {(art.date || art.pub_date) && (
                      <span>Published: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono, monospace)' }}>{art.date || art.pub_date}</strong></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// LIVE TRADING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LiveTradingPage({ selectedSymbol, onSelectSymbol, onSendToPaperTrading, watchlist, onToggleWatchlist }) {
  const [stocks, setStocks] = useState([]);
  const [liveData, setLiveData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol || 'RELIANCE.NS');
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch('/api/batch_quotes')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setStocks(d.filter(s => !s.symbol?.startsWith('^'))); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeSymbol) return;
    const fetchLive = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analysis/live/${activeSymbol}`);
        setLiveData(await res.json());
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetchLive();
    intervalRef.current = setInterval(fetchLive, 30000);
    return () => clearInterval(intervalRef.current);
  }, [activeSymbol]);

  const handleSelectStock = (sym) => {
    setActiveSymbol(sym);
    if (onSelectSymbol) onSelectSymbol(sym);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', minHeight: '600px' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '0.75rem',
        display: 'flex', flexDirection: 'column', maxHeight: '800px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem', padding: '0 4px' }}>
          <Radio size={15} color="var(--green)" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>Live Stock Feed</h3>
        </div>
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {stocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Loading stocks...</div>
          ) : stocks.map(s => {
            const sym = s.symbol;
            const isActive = activeSymbol === sym;
            const pctChange = s.change_pct || 0;
            return (
              <div key={sym} onClick={() => handleSelectStock(sym)}
                style={{
                  background: isActive ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                  border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                  borderRadius: '6px', padding: '7px 9px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.15s',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#ffffff' }}>{sym?.replace('.NS', '')}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>₹{s.price || '—'}</div>
                </div>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  color: pctChange >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {pctChange >= 0 ? '+' : ''}{pctChange?.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
        {!activeSymbol ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
            Select a stock from the left to view live trading signals.
          </div>
        ) : !liveData ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Loader size={20} className="spin" style={{ marginBottom: '0.5rem' }} />
            <div>Loading live intraday signals...</div>
          </div>
        ) : liveData.error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--red)' }}>
            <AlertTriangle size={20} style={{ marginBottom: '0.5rem' }} />
            <div>{liveData.error}</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{activeSymbol?.replace('.NS', '')}</h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Last update: {liveData.timestamp} IST • Intraday 5m Momentum Scan
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  fontSize: '1.35rem', fontWeight: 800,
                  color: liveData.trend_direction === 'up' ? 'var(--green)' : 'var(--red)',
                }}>
                  ₹{liveData.current_price}
                </div>
                <span style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                  background: liveData.trend_direction === 'up' ? 'rgba(46, 213, 115, 0.12)' : 'rgba(255, 71, 87, 0.12)',
                  color: liveData.trend_direction === 'up' ? 'var(--green)' : 'var(--red)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {liveData.trend_direction === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {liveData.trend_direction?.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
              {[
                { label: 'RSI', val: liveData.rsi, color: liveData.rsi < 30 ? 'var(--green)' : liveData.rsi > 70 ? 'var(--red)' : 'var(--accent)' },
                { label: 'VWAP', val: `₹${liveData.vwap}`, color: liveData.above_vwap ? 'var(--green)' : 'var(--red)' },
                { label: 'Predicted Slope', val: `₹${liveData.predicted_price}`, color: 'var(--accent)' },
                { label: 'Vol Ratio', val: `${liveData.volume_ratio}x`, color: liveData.volume_spike ? 'var(--amber)' : 'var(--text-main)' },
              ].map((m, i) => (
                <div key={i} style={{
                  background: 'var(--bg-bar)', padding: '8px 10px', borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.label}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: m.color, marginTop: '2px' }}>{m.val}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--bg-bar)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '0.85rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.6rem', color: '#ffffff' }}>
                <Zap size={14} color="var(--amber)" /> Real-Time Signal Triggers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {liveData.signals?.map((sig, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 10px', borderRadius: '4px',
                    background: sig.type === 'buy' ? 'rgba(46, 213, 115, 0.08)' :
                               sig.type === 'sell' ? 'rgba(255, 71, 87, 0.08)' :
                               sig.type === 'alert' ? 'rgba(255, 165, 2, 0.08)' :
                               'var(--bg-card)',
                    border: `1px solid ${
                      sig.type === 'buy' ? 'rgba(46, 213, 115, 0.25)' :
                      sig.type === 'sell' ? 'rgba(255, 71, 87, 0.25)' :
                      sig.type === 'alert' ? 'rgba(255, 165, 2, 0.25)' :
                      'var(--border)'
                    }`,
                  }}>
                    {sig.type === 'buy' ? <CheckCircle size={14} color="var(--green)" /> :
                     sig.type === 'sell' ? <XCircle size={14} color="var(--red)" /> :
                     sig.type === 'alert' ? <AlertTriangle size={14} color="var(--amber)" /> :
                     <Eye size={14} color="var(--text-muted)" />}
                    <div>
                      <span style={{
                        fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                        color: sig.type === 'buy' ? 'var(--green)' : sig.type === 'sell' ? 'var(--red)' : sig.type === 'alert' ? 'var(--amber)' : 'var(--text-main)',
                      }}>{sig.type}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>{sig.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onSendToPaperTrading({
                symbol: activeSymbol,
                price: liveData.current_price,
                algo_name: liveData.signals?.[0]?.reason || 'Live Intraday Signal',
              })}
              style={{
                background: 'rgba(46, 213, 115, 0.12)', color: 'var(--green)',
                border: '1px solid var(--green)', padding: '8px 16px',
                borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer', alignSelf: 'flex-start',
              }}
            >
              <DollarSign size={14} /> Paper Trade this Signal
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// POST-MARKET PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function PostMarketPage({ marketState, onNavigateToAlgo, watchlist, onToggleWatchlist }) {
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isAnalyzing = marketState === 'analyzing';

  useEffect(() => {
    if (isAnalyzing) return;
    setIsLoading(true);
    fetch('/api/algos/observed?filter=1D')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.signals || []);
        setObservations(list);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isAnalyzing]);

  if (isAnalyzing) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid rgba(255, 165, 2, 0.3)',
        borderRadius: '8px', padding: '2.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: '0.75rem',
      }}>
        <Loader size={30} color="var(--amber)" className="spin" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Post-Market Syncing</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
          Autonomous agents are auditing today's closing figures, algorithmic hits and network reports.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} color="#a855f7" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Post-Market Analysis</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Per-stock algorithmic pattern hits and daily execution review
            </div>
          </div>
        </div>
        <div style={{
          fontSize: '0.72rem', color: '#a855f7', fontWeight: 600,
          background: 'rgba(168, 85, 247, 0.1)', padding: '3px 8px', borderRadius: '4px',
        }}>
          {observations.length} observation{observations.length !== 1 ? 's' : ''} detected
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Loader size={20} className="spin" /><div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Loading observations...</div>
        </div>
      ) : observations.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem', color: 'var(--text-muted)',
          background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)',
        }}>
          <BarChart3 size={32} color="var(--border)" style={{ marginBottom: '0.5rem' }} />
          <div>No algorithmic observations registered today. Check back after market closes.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {observations.map((obs, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '1rem',
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>{obs.symbol?.replace('.NS', '')}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{obs.stock_name || obs.symbol}</div>
                </div>
                <div
                  onClick={() => obs.algo_id && onNavigateToAlgo(obs.algo_id)}
                  style={{
                    background: 'rgba(255, 165, 2, 0.1)', border: '1px solid rgba(255, 165, 2, 0.3)',
                    borderRadius: '4px', padding: '3px 7px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    cursor: obs.algo_id ? 'pointer' : 'default',
                    fontSize: '0.72rem', fontWeight: 700, color: 'var(--amber)',
                  }}
                >
                  <Zap size={11} /> {obs.pattern_name || obs.name || 'Pattern'}
                  {obs.algo_id && <ArrowUpRight size={11} />}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {[
                  { label: 'Direction', val: obs.signal || obs.direction || '—' },
                  { label: 'Confidence', val: obs.confidence ? `${obs.confidence}%` : '—' },
                  { label: 'Observed Price', val: obs.price ? `₹${obs.price}` : '—' },
                  { label: 'Date', val: obs.date || obs.detected_at || 'Today' },
                ].map((d, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-bar)', padding: '5px 7px', borderRadius: '4px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{d.label}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{d.val}</div>
                  </div>
                ))}
              </div>

              {obs.description && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {obs.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
