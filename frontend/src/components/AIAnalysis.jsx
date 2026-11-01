import React, { useState, useEffect } from 'react';
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
  DollarSign
} from 'lucide-react';

export default function AIAnalysis({ 
  selectedSymbol, 
  onSelectSymbol, 
  onNavigateToAlgo,
  onSendToPaperTrading 
}) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Pre-Market Discovery Controller */}
      <div style={{
        background: 'linear-gradient(145deg, var(--bg-card), #161b2a)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
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
            boxShadow: '0 4px 20px var(--accent-glow)'
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
                    gap: '6px'
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
    </div>
  );
}
