import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Clock
} from 'lucide-react';

export default function PaperTrading({ stocks, prefilledOrder, onOrderDone }) {
  const [paperState, setPaperState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderSymbol, setOrderSymbol] = useState(prefilledOrder?.symbol || 'RELIANCE.NS');
  const [orderQty, setOrderQty] = useState(prefilledOrder?.qty || 10);
  const [orderSide, setOrderSide] = useState('BUY');
  const [isAutomating, setIsAutomating] = useState(false);
  const [autoLogs, setAutoLogs] = useState([]);

  useEffect(() => {
    fetchPaperState();
    const interval = setInterval(fetchPaperState, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prefilledOrder) {
      setOrderSymbol(prefilledOrder.symbol);
      setOrderQty(prefilledOrder.qty || 10);
    }
  }, [prefilledOrder]);

  const fetchPaperState = async () => {
    try {
      const res = await fetch('/api/paper/summary');
      const data = await res.json();
      setPaperState(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const currentStock = stocks.find(s => s.symbol === orderSymbol);
    const price = currentStock?.price || 1000;

    try {
      const res = await fetch('/api/paper/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: orderSymbol,
          side: orderSide,
          qty: orderQty,
          price: price,
          algo_name: prefilledOrder?.algo_name || 'Manual Quant Order'
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaperState(data.state);
        if (onOrderDone) onOrderDone();
      } else {
        alert(data.error || 'Order execution failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAccount = async () => {
    if (!window.confirm('Reset Paper Trading account back to ₹10,00,000 INR?')) return;
    try {
      await fetch('/api/paper/reset', { method: 'POST' });
      fetchPaperState();
      setAutoLogs([]);
    } catch (e) {
      console.error(e);
    }
  };

  const runAutomatedAlgoAudit = async () => {
    setIsAutomating(true);
    try {
      // 1. Fetch live multi-agent rankings
      const scanRes = await fetch('/api/analysis/scan');
      const ranked = await scanRes.json();

      // 2. Trigger auto trader
      const autoRes = await fetch('/api/paper/auto_execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: ranked })
      });
      const result = await autoRes.json();
      setPaperState(result.summary);
      if (result.executed?.length > 0) {
        setAutoLogs(prev => [...result.executed, ...prev]);
      } else {
        alert('Auto-trader ran: All risk guardrails satisfied. No new high-conviction (>80%) trades required.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAutomating(false);
    }
  };

  const stats = paperState?.stats || {};
  const isOverallProfit = (stats.total_pnl ?? 0) >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner: Verification & Proof of Profit Engine */}
      <div style={{
        background: 'linear-gradient(145deg, var(--bg-card), #142028)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
            <ShieldCheck size={16} /> LIVE PAPER TRADING SIMULATION TESTBED
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Algorithmic P&L Verification Engine</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Test our algorithmic models in real-time with zero risk using a <strong>₹10,00,000 INR</strong> virtual capital.
            Verify that signals compound positive profits and beat standard benchmarks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={runAutomatedAlgoAudit}
            disabled={isAutomating}
            style={{
              background: 'linear-gradient(135deg, #10b981, #00e5b3)',
              color: '#0a0d14',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Play size={16} fill="#0a0d14" /> Auto-Execute Best Algos
          </button>

          <button
            onClick={handleResetAccount}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '10px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
            title="Reset capital to 10 Lakhs"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      {/* KPI Cards: Net Worth, P&L, Win Rate, Cash */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PORTFOLIO NET VALUE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0' }}>
            ₹{stats.portfolio_value ? Number(stats.portfolio_value).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '10,00,000.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initial: ₹10,00,000.00</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NET PROFIT / LOSS (P&L)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0', color: isOverallProfit ? 'var(--green)' : 'var(--red)' }}>
            {isOverallProfit ? '+' : ''}₹{stats.total_pnl ? Number(stats.total_pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: isOverallProfit ? 'var(--green)' : 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isOverallProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isOverallProfit ? '+' : ''}{stats.total_pnl_pct ?? 0}% Returns
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WIN RATE & ACCURACY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0', color: 'var(--accent)' }}>
            {stats.win_rate ?? 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats.winning_trades ?? 0} Won / {stats.total_trades ?? 0} Closed Trades
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UNCOMMITTED CASH BUFFER</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0' }}>
            ₹{stats.cash_balance ? Number(stats.cash_balance).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '10,00,000.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available for allocations</div>
        </div>
      </div>

      {/* Main Grid: Active Positions & Order Pad */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left: Open Positions Table */}
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Active Open Positions</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live market marking from Yahoo Finance prices</div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {Object.keys(paperState?.positions || {}).length} Open
            </span>
          </div>

          <div className="table-responsive-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>SYMBOL</th>
                  <th style={{ padding: '8px' }}>SIDE / ALGO</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>QTY</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AVG ENTRY</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>LTP</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>UNREALIZED P&L</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {!paperState?.positions || Object.keys(paperState.positions).length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No open positions. Place an order or click "Auto-Execute Best Algos" to open verified trades.
                    </td>
                  </tr>
                ) : (
                  Object.entries(paperState.positions).map(([sym, pos]) => {
                    const isProfit = (pos.pnl ?? 0) >= 0;
                    return (
                      <tr key={sym} style={{ borderBottom: '1px solid rgba(35, 41, 61, 0.5)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>{sym.replace('.NS', '')}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: pos.side === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: pos.side === 'BUY' ? 'var(--green)' : 'var(--red)',
                            marginRight: '6px'
                          }}>
                            {pos.side}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pos.algo_name || 'Algo'}</span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{pos.qty}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>₹{pos.avg_price?.toFixed(2)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>₹{pos.current_price?.toFixed(2)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <span style={{
                            fontWeight: 700,
                            color: isProfit ? 'var(--green)' : 'var(--red)'
                          }}>
                            {isProfit ? '+' : ''}₹{pos.pnl?.toFixed(2)} ({isProfit ? '+' : ''}{pos.pnl_pct?.toFixed(2)}%)
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            onClick={async () => {
                              const cur = stocks.find(s => s.symbol === sym)?.price || pos.avg_price;
                              await fetch('/api/paper/order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  symbol: sym,
                                  side: 'SELL',
                                  qty: pos.qty,
                                  price: cur,
                                  algo_name: 'Manual Square-Off'
                                })
                              });
                              fetchPaperState();
                            }}
                            style={{
                              background: 'rgba(244, 63, 94, 0.15)',
                              border: '1px solid var(--red)',
                              color: 'var(--red)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Closed Trades History */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Recent Realized Trades</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(!paperState?.closed_trades || paperState.closed_trades.length === 0) ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No closed trades yet.</div>
              ) : (
                paperState.closed_trades.map((t, idx) => {
                  const isWon = t.pnl > 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div>
                        <strong>{t.symbol.replace('.NS', '')}</strong> ({t.qty} shares)
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.algo_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: isWon ? 'var(--green)' : 'var(--red)' }}>
                          {isWon ? '+' : ''}₹{t.pnl} ({t.pnl_pct}%)
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.exit_time}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Manual Order Execution Pad */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Quick Order Entry</h3>

          <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                TARGET SYMBOL
              </label>
              <select
                value={orderSymbol}
                onChange={(e) => setOrderSymbol(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              >
                {stocks.filter(s => !s.symbol.startsWith('^')).map(s => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol.replace('.NS', '')} — {s.name} (₹{s.price})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setOrderSide('BUY')}
                style={{
                  background: orderSide === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary)',
                  border: orderSide === 'BUY' ? '1px solid var(--green)' : '1px solid var(--border)',
                  color: orderSide === 'BUY' ? 'var(--green)' : 'var(--text-muted)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('SELL')}
                style={{
                  background: orderSide === 'SELL' ? 'rgba(244, 63, 94, 0.2)' : 'var(--bg-secondary)',
                  border: orderSide === 'SELL' ? '1px solid var(--red)' : '1px solid var(--border)',
                  color: orderSide === 'SELL' ? 'var(--red)' : 'var(--text-muted)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                SELL / SHORT
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                QUANTITY (SHARES)
              </label>
              <input
                type="number"
                min="1"
                value={orderQty}
                onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: orderSide === 'BUY' ? 'var(--green)' : 'var(--red)',
                color: '#0a0d14',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                marginTop: '0.5rem'
              }}
            >
              {isLoading ? 'Executing...' : `Execute ${orderSide} Paper Order`}
            </button>
          </form>

          {/* Auto Log Stream */}
          {autoLogs.length > 0 && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                Automated Executor Activity:
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {autoLogs.map((l, i) => (
                  <div key={i}>• {l.action} on {l.symbol} at ₹{l.price}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
