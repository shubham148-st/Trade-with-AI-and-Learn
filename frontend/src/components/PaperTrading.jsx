import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight, 
  ShieldCheck, 
  Percent, 
  Clock,
  Calendar,
  X,
  Info,
  RefreshCw,
  Layers,
  Sliders,
  DollarSign,
  Ban
} from 'lucide-react';

const STRATEGY_SOURCE_OPTIONS = [
  { id: 'PRE_MARKET', label: 'Pre-Market Screen', desc: 'High institutional conviction from morning scan' },
  { id: 'LIVE_ALGO', label: 'Live Algo Signals', desc: 'Real-time breakout and technical indicators' },
  { id: 'POST_MARKET', label: 'Post-Market Setups', desc: 'End-of-day institutional accumulation patterns' },
  { id: 'LEARNER_AGENT', label: 'Learner Agent', desc: 'Rule-based pattern detector observations' },
  { id: 'CUSTOM_STRATEGY', label: 'Custom Strategies', desc: 'User-defined algorithmic parameters' }
];

export default function PaperTrading({ stocks = [], prefilledOrder, onOrderDone }) {
  // State variables
  const [paperState, setPaperState] = useState(null);
  const [agentConfig, setAgentConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('positions'); // positions | pending | trades | history | equity

  // Modals & Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGearMenuOpen, setIsGearMenuOpen] = useState(false);
  const gearMenuRef = useRef(null);

  // Customizable Layout & Modules Configuration (persisted in localStorage)
  const [layoutConfig, setLayoutConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('paper_trading_layout');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      showScrubber: true,
      showKpis: true,
      showOrderEntry: true,
      showBrokerage: false, // removed by default as requested
      showEquityCurve: true
    };
  });

  const toggleLayoutFeature = (key) => {
    setLayoutConfig(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('paper_trading_layout', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Real-time NSE Market Hours Check (Mon-Fri 09:15 - 15:30 IST)
  const isMarketOpen = useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5)); // UTC+5:30
    const day = ist.getDay();
    if (day === 0 || day === 6) return false; // Saturday / Sunday closed
    const curMins = ist.getHours() * 60 + ist.getMinutes();
    return curMins >= (9 * 60 + 15) && curMins <= (15 * 60 + 30);
  }, []);

  // Time Machine Scrubber Slider (9:15 AM to 3:30 PM = 375 minutes)
  const [isSimMode, setIsSimMode] = useState(false);
  const [simMinutes, setSimMinutes] = useState(375); // 0 to 375, default 375 (3:30 PM / Live)
  const trackRef = useRef(null);
  const [hoverMins, setHoverMins] = useState(null);
  const [hoverX, setHoverX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Order Placement Form
  const [productType, setProductType] = useState('CNC'); // CNC | INTRADAY
  const [orderType, setOrderType] = useState('MARKET'); // MARKET | LIMIT | SL | SL-M | GTT
  const [orderSide, setOrderSide] = useState('BUY'); // BUY | SELL
  const [orderSymbol, setOrderSymbol] = useState(prefilledOrder?.symbol || 'RELIANCE.NS');
  const [orderQty, setOrderQty] = useState(prefilledOrder?.qty || 10);
  const [orderLimitPrice, setOrderLimitPrice] = useState('');
  const [orderTriggerPrice, setOrderTriggerPrice] = useState('');
  const [orderStopLoss, setOrderStopLoss] = useState('');
  const [orderTarget, setOrderTarget] = useState('');
  const [orderStatusMessage, setOrderStatusMessage] = useState(null);

  // Agent Settings Form (Draft)
  const [draftConfig, setDraftConfig] = useState({
    auto_trade_enabled: false,
    allowed_strategies: ['PRE_MARKET', 'LIVE_ALGO', 'POST_MARKET', 'LEARNER_AGENT'],
    max_capital_allocation: 500000,
    max_allocation_per_trade_pct: 10,
    max_open_positions: 5,
    default_stop_loss_pct: 2.0,
    default_target_pct: 4.0,
    min_confidence_score: 75,
    symbol_whitelist: []
  });

  // Current selected stock
  const currentStock = useMemo(() => {
    return stocks.find(s => s.symbol === orderSymbol) || { symbol: orderSymbol, price: 1000, change_pct: 0 };
  }, [stocks, orderSymbol]);

  // Sync prefilled order props
  useEffect(() => {
    if (prefilledOrder) {
      if (prefilledOrder.symbol) setOrderSymbol(prefilledOrder.symbol);
      if (prefilledOrder.qty) setOrderQty(prefilledOrder.qty);
      if (prefilledOrder.side) setOrderSide(prefilledOrder.side.toUpperCase());
      if (prefilledOrder.stopLoss) setOrderStopLoss(prefilledOrder.stopLoss);
      if (prefilledOrder.target) setOrderTarget(prefilledOrder.target);
    }
  }, [prefilledOrder]);

  // Initial fetch and interval
  useEffect(() => {
    fetchPaperSummary();
    fetchAgentConfig();
    const interval = setInterval(fetchPaperSummary, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchPaperSummary = async () => {
    try {
      const res = await fetch('/api/paper/summary');
      if (res.ok) {
        const data = await res.json();
        setPaperState(data);
      }
    } catch (e) {
      console.error('Failed to fetch paper summary:', e);
    }
  };

  const fetchAgentConfig = async () => {
    try {
      const res = await fetch('/api/paper/agent_config');
      if (res.ok) {
        const data = await res.json();
        setAgentConfig(data);
        setDraftConfig(data);
      }
    } catch (e) {
      console.error('Failed to fetch agent config:', e);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchPaperSummary();
    await fetchAgentConfig();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Estimate charges
  const estimatedCharges = useMemo(() => {
    const ltp = currentStock?.price || 1000;
    const effectivePrice = orderType === 'LIMIT' && orderLimitPrice ? parseFloat(orderLimitPrice) || ltp : ltp;
    const qty = parseInt(orderQty) || 0;
    const turnover = effectivePrice * qty;

    const brokerage = Math.min(turnover * 0.0003, 20.0);
    const stt = orderSide === 'SELL' ? (productType === 'INTRADAY' ? turnover * 0.00025 : turnover * 0.001) : 0;
    const txn = turnover * 0.0000345;
    const gst = (brokerage + txn) * 0.18;
    const stamp = orderSide === 'BUY' ? turnover * 0.00015 : 0;
    const total = brokerage + stt + txn + gst + stamp;

    return {
      turnover: turnover,
      brokerage: brokerage.toFixed(2),
      stt: stt.toFixed(2),
      taxes: (txn + gst + stamp).toFixed(2),
      total: total.toFixed(2),
      requiredMargin: (turnover + (orderSide === 'BUY' ? total : 0)).toFixed(2)
    };
  }, [currentStock, orderType, orderLimitPrice, orderQty, orderSide, productType]);

  // Execute Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setOrderStatusMessage(null);

    const ltp = currentStock?.price || 1000;
    const execPrice = orderType === 'LIMIT' && orderLimitPrice ? parseFloat(orderLimitPrice) : ltp;

    const payload = {
      symbol: orderSymbol,
      side: orderSide,
      qty: parseInt(orderQty) || 1,
      price: execPrice,
      order_type: orderType,
      trigger_price: orderTriggerPrice ? parseFloat(orderTriggerPrice) : null,
      product_type: productType,
      stop_loss: orderStopLoss ? parseFloat(orderStopLoss) : null,
      target: orderTarget ? parseFloat(orderTarget) : null,
      algo_name: `Manual (${orderType} - ${productType})`,
      strategy_source: 'MANUAL'
    };

    try {
      const res = await fetch('/api/paper/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setOrderStatusMessage({
          type: 'success',
          text: data.status === 'PENDING'
            ? `Order queued as PENDING (${data.order.order_type} at ₹${data.order.trigger_price || data.order.price})`
            : `Order executed successfully: ${data.order.side} ${data.order.qty} ${data.order.symbol} @ ₹${data.order.price}`
        });
        if (data.state) setPaperState(data.state);
        else fetchPaperSummary();
        if (onOrderDone) onOrderDone();
      } else {
        setOrderStatusMessage({ type: 'error', text: data.error || 'Execution failed' });
      }
    } catch (err) {
      setOrderStatusMessage({ type: 'error', text: 'Network error placing order' });
    } finally {
      setIsLoading(false);
    }
  };

  // Square off position
  const handleSquareOff = async (symbol, pos) => {
    if (!window.confirm(`Square off full position in ${symbol} (${pos.qty} shares) at market price?`)) return;
    try {
      const res = await fetch('/api/paper/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side: pos.side === 'BUY' ? 'SELL' : 'BUY',
          qty: pos.qty,
          price: pos.current_price || pos.avg_price,
          order_type: 'MARKET',
          product_type: pos.product_type || 'CNC',
          algo_name: 'Manual Square Off',
          strategy_source: 'MANUAL'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchPaperSummary();
      } else {
        alert(data.error || 'Failed to square off');
      }
    } catch (e) {
      alert('Error squaring off position');
    }
  };

  // Cancel pending order
  const handleCancelPending = async (orderId) => {
    try {
      const res = await fetch('/api/paper/cancel_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });
      const data = await res.json();
      if (data.success) {
        fetchPaperSummary();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (e) {
      alert('Error cancelling order');
    }
  };

  // Save Agent Settings
  const handleSaveAgentConfig = async () => {
    try {
      const res = await fetch('/api/paper/agent_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftConfig)
      });
      const data = await res.json();
      if (data.success) {
        setAgentConfig(data.agent_config);
        setIsSettingsOpen(false);
      }
    } catch (e) {
      alert('Error updating agent settings');
    }
  };

  // Close gear menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gearMenuRef.current && !gearMenuRef.current.contains(e.target)) {
        setIsGearMenuOpen(false);
      }
    };
    if (isGearMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGearMenuOpen]);

  // Toggle AI Auto-Trade quickly via header slider
  const handleToggleAutoTrade = async (newVal) => {
    const updated = { ...(agentConfig || draftConfig), auto_trade_enabled: newVal };
    setAgentConfig(updated);
    setDraftConfig(updated);
    try {
      await fetch('/api/paper/agent_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error('Failed to toggle auto trade', e);
    }
  };

  // Convert minutes (0 to 375) into readable market clock time (9:15 AM to 3:30 PM)
  const formatMarketTime = (mins) => {
    const totalMinutes = 9 * 60 + 15 + mins;
    const h24 = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 > 12 ? h24 - 12 : h24;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  // Update scrubber value, set SIM mode, and turn off AI mode (Requirement 2)
  const updateScrubberFromClientX = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rawX, rect.width));
    const pct = rect.width > 0 ? clampedX / rect.width : 0;
    const mins = Math.round(pct * 375);
    setSimMinutes(mins);
    setIsSimMode(true);

    // Requirement 2: SIM mode turns off the AI mode
    if (agentConfig?.auto_trade_enabled || draftConfig?.auto_trade_enabled) {
      handleToggleAutoTrade(false);
    }
  };

  const handleTrackMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateScrubberFromClientX(e.clientX);

    const onMouseMove = (moveEvent) => {
      updateScrubberFromClientX(moveEvent.clientX);
      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const rawX = moveEvent.clientX - rect.left;
        const clampedX = Math.max(0, Math.min(rawX, rect.width));
        const pct = rect.width > 0 ? clampedX / rect.width : 0;
        setHoverMins(Math.round(pct * 375));
        setHoverX(clampedX);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTrackMouseMove = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rawX, rect.width));
    const pct = rect.width > 0 ? clampedX / rect.width : 0;
    setHoverMins(Math.round(pct * 375));
    setHoverX(clampedX);
  };

  const handleTrackMouseLeave = () => {
    if (!isDragging) {
      setHoverMins(null);
      setHoverX(null);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setIsDragging(true);
      updateScrubberFromClientX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updateScrubberFromClientX(e.touches[0].clientX);
    }
  };

  // Reset Account
  const handleReset = async () => {
    if (!window.confirm('Reset virtual paper trading portfolio to ₹10,00,000 INR? All positions and trade logs will be cleared.')) return;
    try {
      const res = await fetch('/api/paper/reset', { method: 'POST' });
      const data = await res.json();
      setPaperState(data);
      setIsSimMode(false);
      setSimMinutes(375);
    } catch (e) {
      alert('Error resetting account');
    }
  };

  const stats = paperState?.stats || {};
  const positions = paperState?.positions ? Object.values(paperState.positions) : [];
  const pendingOrders = paperState?.pending_orders || [];
  const closedTrades = paperState?.closed_trades || [];
  const ordersHistory = paperState?.orders || [];
  const equityCurve = paperState?.equity_curve || [];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 40px' }}>
      
      {/* ── TOP HEADER BAR ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '14px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        marginBottom: '14px'
      }}>
        {/* Left: Title and 3 Indicators (AI, LIVE, SIM) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
            PAPER TRADING PORTFOLIO
          </h1>

          {/* 3 Indicators: AI, LIVE, SIM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* AI Status Dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: agentConfig?.auto_trade_enabled ? '#2ed573' : '#4b5563',
                boxShadow: agentConfig?.auto_trade_enabled ? '0 0 6px rgba(46, 213, 115, 0.8)' : 'none',
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: agentConfig?.auto_trade_enabled ? '#fff' : 'var(--text-muted)' }}>
                AI
              </span>
            </div>

            {/* LIVE Status Dot (Active ONLY during real-time market hours when not in SIM mode) */}
            <div
              onClick={() => { setIsSimMode(false); setSimMinutes(375); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', minHeight: '24px', touchAction: 'manipulation' }}
              title={isMarketOpen ? 'Live Market (NSE Open)' : 'Market Closed (NSE Hours: Mon-Fri 09:15 - 15:30 IST)'}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIsSimMode(false); setSimMinutes(375); } }}
              aria-label="Switch to Live Market Stream"
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: (!isSimMode && isMarketOpen) ? '#2ed573' : '#4b5563',
                boxShadow: (!isSimMode && isMarketOpen) ? '0 0 6px rgba(46, 213, 115, 0.8)' : 'none',
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (!isSimMode && isMarketOpen) ? '#fff' : 'var(--text-muted)' }}>
                LIVE {!isMarketOpen && <span style={{ fontSize: '0.66rem', opacity: 0.65 }}>(CLOSED)</span>}
              </span>
            </div>

            {/* SIM Status Dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isSimMode ? '#2ed573' : '#4b5563',
                boxShadow: isSimMode ? '0 0 6px rgba(46, 213, 115, 0.8)' : 'none',
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSimMode ? '#fff' : 'var(--text-muted)' }}>
                SIM
              </span>
            </div>
          </div>
        </div>

        {/* Right: AI Mode Switch and Cog Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* AI On/Off Slider Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: agentConfig?.auto_trade_enabled ? '#fff' : 'var(--text-muted)' }}>
              AI Mode
            </span>
            <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '34px', height: '24px', cursor: 'pointer', touchAction: 'manipulation' }}>
              <input
                type="checkbox"
                checked={!!agentConfig?.auto_trade_enabled}
                onChange={(e) => handleToggleAutoTrade(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
                aria-label="Toggle autonomous AI trading mode"
              />
              <span style={{
                position: 'absolute',
                top: '3px',
                left: 0,
                right: 0,
                bottom: '3px',
                borderRadius: '18px',
                background: agentConfig?.auto_trade_enabled ? 'var(--green)' : 'var(--border)',
                transition: 'background-color 0.2s ease'
              }} />
              <span style={{
                position: 'absolute',
                height: '14px',
                width: '14px',
                left: agentConfig?.auto_trade_enabled ? '17px' : '2px',
                top: '5px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
              }} />
            </label>
          </div>

          {/* Cog Icon with Customizable Layout & Quick Actions */}
          <div style={{ position: 'relative' }} ref={gearMenuRef}>
            <button
              onClick={() => setIsGearMenuOpen(!isGearMenuOpen)}
              title="Settings & Layout Customization"
              aria-label="Settings and layout options"
              aria-expanded={isGearMenuOpen}
              style={{
                padding: '8px 10px',
                minWidth: '34px',
                minHeight: '34px',
                borderRadius: '6px',
                background: isGearMenuOpen ? 'var(--bg-card-hover)' : 'var(--bg-bar)',
                color: isGearMenuOpen ? 'var(--accent)' : 'var(--text-main)',
                border: `1px solid ${isGearMenuOpen ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                touchAction: 'manipulation'
              }}
            >
              <Settings size={18} style={{ transform: isGearMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* Roll-down Dropdown Menu */}
            {isGearMenuOpen && (
              <div className="paper-gear-dropdown" style={{ width: '260px' }}>
                <div style={{ padding: '8px 12px 4px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Quick Actions
                </div>
                <button
                  className="paper-gear-item"
                  onClick={() => { handleManualRefresh(); setIsGearMenuOpen(false); }}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                  <span>Refresh & Sync Quotes</span>
                </button>
                <button
                  className="paper-gear-item"
                  onClick={() => { setIsSettingsOpen(true); setIsGearMenuOpen(false); }}
                >
                  <Settings size={14} />
                  <span>Agent Guardrails</span>
                </button>
                <button
                  className="paper-gear-item danger"
                  onClick={() => { handleReset(); setIsGearMenuOpen(false); }}
                >
                  <RotateCcw size={14} />
                  <span>Reset Portfolio (₹10L)</span>
                </button>

                <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
                <div style={{ padding: '6px 12px 4px', fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Layout & Modules (Customizable)
                </div>

                <button
                  className="paper-gear-item"
                  onClick={() => toggleLayoutFeature('showScrubber')}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>Timeline Scrubber</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: layoutConfig.showScrubber ? 'var(--accent)' : 'var(--text-sub)' }}>
                    {layoutConfig.showScrubber ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  className="paper-gear-item"
                  onClick={() => toggleLayoutFeature('showKpis')}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>KPI Overview Strip</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: layoutConfig.showKpis ? 'var(--accent)' : 'var(--text-sub)' }}>
                    {layoutConfig.showKpis ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  className="paper-gear-item"
                  onClick={() => toggleLayoutFeature('showOrderEntry')}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>Order Entry Panel</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: layoutConfig.showOrderEntry ? 'var(--accent)' : 'var(--text-sub)' }}>
                    {layoutConfig.showOrderEntry ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  className="paper-gear-item"
                  onClick={() => toggleLayoutFeature('showBrokerage')}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>Brokerage & Taxes</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: layoutConfig.showBrokerage ? 'var(--accent)' : 'var(--text-sub)' }}>
                    {layoutConfig.showBrokerage ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  className="paper-gear-item"
                  onClick={() => toggleLayoutFeature('showEquityCurve')}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>Equity Curve Tab</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: layoutConfig.showEquityCurve ? 'var(--accent)' : 'var(--text-sub)' }}>
                    {layoutConfig.showEquityCurve ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TIMELINE SCRUBBER (SLIDABLE, CLICKABLE, WITH HOVER TOOLTIP) ── */}
      {layoutConfig.showScrubber && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 20px 14px',
          marginBottom: '20px',
          userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Market Timeline Scrubber
              </span>
              {isSimMode ? (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  background: 'rgba(0, 212, 170, 0.12)',
                  padding: '1px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 212, 170, 0.25)'
                }}>
                  Simulated Time: {formatMarketTime(simMinutes)}
                </span>
              ) : (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: isMarketOpen ? 'var(--green)' : 'var(--text-muted)',
                  background: isMarketOpen ? 'rgba(46, 213, 115, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '1px 8px',
                  borderRadius: '4px'
                }}>
                  {isMarketOpen ? 'Live Market' : 'Market Closed (09:15 - 15:30 IST)'}
                </span>
              )}
            </div>
            {isSimMode && (
              <button
                onClick={() => { setIsSimMode(false); setSimMinutes(375); }}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Snap back to Live
              </button>
            )}
          </div>

          {/* Interactive Custom Scrubber Track (Draggable, Clickable, Hover Time) */}
          <div 
            ref={trackRef}
            onMouseDown={handleTrackMouseDown}
            onMouseMove={handleTrackMouseMove}
            onMouseLeave={handleTrackMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
            style={{
              position: 'relative',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              cursor: isDragging ? 'grabbing' : 'pointer'
            }}
          >
            {/* Background Track Line */}
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '5px',
              background: 'var(--border)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              {/* Active Progress Fill */}
              <div style={{
                height: '100%',
                width: `${(simMinutes / 375) * 100}%`,
                background: isSimMode ? 'var(--accent)' : 'var(--green)',
                borderRadius: '3px',
                transition: isDragging ? 'none' : 'width 0.08s ease'
              }} />
            </div>

            {/* Floating Hover Time Tooltip */}
            {hoverMins !== null && hoverX !== null && (
              <div style={{
                position: 'absolute',
                left: `${hoverX}px`,
                top: '-26px',
                transform: 'translateX(-50%)',
                background: '#090a0d',
                border: '1px solid var(--accent)',
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--accent)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                zIndex: 10
              }}>
                {formatMarketTime(hoverMins)}
              </div>
            )}

            {/* Draggable Scrubber Thumb Handle */}
            <div style={{
              position: 'absolute',
              left: `${(simMinutes / 375) * 100}%`,
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: isSimMode ? 'var(--accent)' : 'var(--green)',
              border: '2px solid #0f1117',
              boxShadow: isSimMode ? '0 0 10px rgba(0, 212, 170, 0.8)' : '0 0 8px rgba(46, 213, 115, 0.6)',
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'left 0.08s ease',
              zIndex: 5
            }} />
          </div>

          {/* Milestone ticks: 9:15 till 3:30 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--text-sub)',
            marginTop: '4px',
            fontWeight: 600
          }}>
            <span>9:15</span>
            <span>10:30</span>
            <span>11:30</span>
            <span>12:30</span>
            <span>1:30</span>
            <span>2:30</span>
            <span>3:30</span>
          </div>
        </div>
      )}

      {/* ── KPI METRICS STRIP (CUSTOMIZABLE) ────────────────────────────── */}
      {layoutConfig.showKpis && (
        <div className="paper-kpi-grid">
          {/* Card 1: Portfolio Value */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Portfolio Value
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              ₹{(stats.portfolio_value || 1000000).toLocaleString('en-IN')}
            </div>
            <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              Cash: ₹{(stats.cash_balance || 1000000).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Card 2: Total P&L */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Total Net P&L
            </div>
            <div className="tabular-nums" style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              marginTop: '4px',
              color: (stats.total_pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {(stats.total_pnl || 0) >= 0 ? '+' : ''}₹{(stats.total_pnl || 0).toLocaleString('en-IN')}
            </div>
            <div className="tabular-nums" style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              marginTop: '4px',
              color: (stats.total_pnl_pct || 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {(stats.total_pnl_pct || 0) >= 0 ? '+' : ''}{(stats.total_pnl_pct || 0).toFixed(2)}%
            </div>
          </div>

          {/* Card 3: Realized P&L */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Realized P&L
            </div>
            <div className="tabular-nums" style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              marginTop: '4px',
              color: (stats.realized_pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {(stats.realized_pnl || 0) >= 0 ? '+' : ''}₹{(stats.realized_pnl || 0).toLocaleString('en-IN')}
            </div>
            <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              Closed Trades: {stats.total_trades || 0}
            </div>
          </div>

          {/* Card 4: Unrealized P&L */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Unrealized P&L
            </div>
            <div className="tabular-nums" style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              marginTop: '4px',
              color: (stats.unrealized_pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {(stats.unrealized_pnl || 0) >= 0 ? '+' : ''}₹{(stats.unrealized_pnl || 0).toLocaleString('en-IN')}
            </div>
            <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              Open Positions: {positions.length}
            </div>
          </div>

          {/* Card 5: Win Rate & Trade Stats (Brokerage Charges Removed unless toggled on) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {layoutConfig.showBrokerage ? 'Win Rate / Charges' : 'Win Rate & Stats'}
            </div>
            <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {(stats.win_rate || 0).toFixed(1)}%
            </div>
            <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              {layoutConfig.showBrokerage 
                ? `Brokerage & STT: ₹${(stats.total_charges || 0).toLocaleString('en-IN')}`
                : `Total Executions: ${stats.total_trades || 0}`}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE GRID (CUSTOMIZABLE FULL-WIDTH OR SPLIT) ──────── */}
      <div className="paper-layout-grid" style={{ gridTemplateColumns: layoutConfig.showOrderEntry ? '340px 1fr' : '1fr' }}>
        
        {/* ── LEFT COLUMN: GROWW/ZERODHA ORDER PANEL (CUSTOMIZABLE) ────── */}
        {layoutConfig.showOrderEntry && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '18px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              ORDER ENTRY
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              LTP: <strong style={{ color: '#fff' }}>₹{currentStock?.price ? currentStock.price.toFixed(2) : '---'}</strong>
            </span>
          </div>

          {/* Product Type (CNC vs INTRADAY) */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-bar)',
            padding: '3px',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <button
              type="button"
              onClick={() => setProductType('CNC')}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: productType === 'CNC' ? 'var(--bg-card)' : 'transparent',
                color: productType === 'CNC' ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              Delivery (CNC)
            </button>
            <button
              type="button"
              onClick={() => setProductType('INTRADAY')}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: productType === 'INTRADAY' ? 'var(--bg-card)' : 'transparent',
                color: productType === 'INTRADAY' ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              Intraday (MIS)
            </button>
          </div>

          {/* Side Selector (BUY vs SELL) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setOrderSide('BUY')}
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: orderSide === 'BUY' ? '1px solid var(--green)' : '1px solid var(--border)',
                background: orderSide === 'BUY' ? 'rgba(46, 213, 115, 0.15)' : 'var(--bg-bar)',
                color: orderSide === 'BUY' ? 'var(--green)' : 'var(--text-muted)'
              }}
            >
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => setOrderSide('SELL')}
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: orderSide === 'SELL' ? '1px solid var(--red)' : '1px solid var(--border)',
                background: orderSide === 'SELL' ? 'rgba(255, 71, 87, 0.15)' : 'var(--bg-bar)',
                color: orderSide === 'SELL' ? 'var(--red)' : 'var(--text-muted)'
              }}
            >
              SELL / SHORT
            </button>
          </div>

          {/* Order Type Tabs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '14px',
            background: 'var(--bg-bar)',
            padding: '3px',
            borderRadius: '6px'
          }}>
            {['MARKET', 'LIMIT', 'SL', 'SL-M', 'GTT'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                style={{
                  flex: '1 0 18%',
                  padding: '5px 2px',
                  fontSize: '0.69rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: orderType === type ? 'var(--bg-card)' : 'transparent',
                  color: orderType === type ? '#fff' : 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          <form onSubmit={handlePlaceOrder}>
            {/* Symbol Field */}
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="paper-symbol-select" style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                SCRIP / SYMBOL
              </label>
              <select
                id="paper-symbol-select"
                value={orderSymbol}
                onChange={(e) => setOrderSymbol(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#12141a',
                  color: '#ffffff',
                  colorScheme: 'dark',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '0.85rem'
                }}
              >
                {stocks.map(s => (
                  <option key={s.symbol} value={s.symbol} style={{ backgroundColor: '#12141a', color: '#ffffff' }}>
                    {s.symbol} — ₹{s.price ? s.price.toFixed(2) : '—'} ({s.name || ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Qty Field */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label htmlFor="paper-qty-input" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  QUANTITY
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[10, 25, 50, 100].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setOrderQty(q)}
                      aria-label={`Set quantity to ${q}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        minHeight: '24px',
                        minWidth: '28px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-bar)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        touchAction: 'manipulation'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="paper-qty-input"
                type="number"
                min="1"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-bar)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '8px 10px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Limit Price Field (when LIMIT, SL, GTT) */}
            {['LIMIT', 'SL', 'GTT'].includes(orderType) && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  LIMIT PRICE (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={orderLimitPrice}
                  onChange={(e) => setOrderLimitPrice(e.target.value)}
                  placeholder={`Current: ₹${currentStock?.price || 1000}`}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-bar)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            )}

            {/* Trigger Price Field (when SL, SL-M, GTT) */}
            {['SL', 'SL-M', 'GTT'].includes(orderType) && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  TRIGGER PRICE (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={orderTriggerPrice}
                  onChange={(e) => setOrderTriggerPrice(e.target.value)}
                  placeholder="Trigger benchmark"
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-bar)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            )}

            {/* Optional Bracket: Stop Loss & Target */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  STOP LOSS (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={orderStopLoss}
                  onChange={(e) => setOrderStopLoss(e.target.value)}
                  placeholder="Optional SL"
                  style={{
                    width: '100%',
                    background: 'var(--bg-bar)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '7px 8px',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  TARGET (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={orderTarget}
                  onChange={(e) => setOrderTarget(e.target.value)}
                  placeholder="Optional Target"
                  style={{
                    width: '100%',
                    background: 'var(--bg-bar)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '7px 8px',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            {/* Charges Breakdown Preview (Toggleable via Cog Menu) */}
            {layoutConfig.showBrokerage ? (
              <div style={{
                background: 'var(--bg-bar)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Order Turnover:</span>
                  <span style={{ color: '#fff' }}>₹{estimatedCharges.turnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Est. Brokerage (0.03% / ₹20 cap):</span>
                  <span style={{ color: '#fff' }}>₹{estimatedCharges.brokerage}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>STT & Regulatory Taxes:</span>
                  <span style={{ color: '#fff' }}>₹{estimatedCharges.taxes}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '5px',
                  borderTop: '1px solid var(--border)',
                  fontWeight: 700
                }}>
                  <span style={{ color: 'var(--text-main)' }}>Total Margin Required:</span>
                  <span style={{ color: 'var(--accent)' }}>₹{parseFloat(estimatedCharges.requiredMargin).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-bar)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '14px',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Required Capital:</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{estimatedCharges.turnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: orderSide === 'BUY' ? 'var(--green)' : 'var(--red)',
                color: '#000',
                touchAction: 'manipulation'
              }}
            >
              {isLoading ? 'Executing…' : `${orderSide} ${orderQty} ${orderSymbol} (${orderType})`}
            </button>
          </form>

          {/* Feedback message */}
          {orderStatusMessage && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: orderStatusMessage.type === 'success' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                color: orderStatusMessage.type === 'success' ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${orderStatusMessage.type === 'success' ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255, 71, 87, 0.3)'}`
              }}
            >
              {orderStatusMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
              <span>{orderStatusMessage.text}</span>
            </div>
          )}
        </div>
        )}

        {/* ── RIGHT COLUMN: PORTFOLIO TABS & TABLES ────────────────────── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Tab Navigation Strip */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-bar)',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setActiveTab('positions')}
              style={{
                padding: '12px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === 'positions' ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === 'positions' ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              Positions ({positions.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '12px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === 'pending' ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === 'pending' ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              Pending Orders ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              style={{
                padding: '12px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === 'trades' ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === 'trades' ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              Closed Trades ({closedTrades.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '12px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === 'history' ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === 'history' ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              Order Log ({ordersHistory.length})
            </button>
            {layoutConfig.showEquityCurve && (
              <button
                onClick={() => setActiveTab('equity')}
                style={{
                  padding: '12px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: activeTab === 'equity' ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'equity' ? '2px solid var(--accent)' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                Equity Curve
              </button>
            )}
          </div>

          <div style={{ padding: '16px 20px', minHeight: '360px' }}>
            
            {/* ── TAB 1: POSITIONS ─────────────────────────────────────── */}
            {activeTab === 'positions' && (
              <div>
                {positions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <Layers size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>No Active Positions</div>
                    <p style={{ fontSize: '0.8rem', maxWidth: '380px', margin: '6px auto 0' }}>
                      Execute a manual order using the Order Entry panel or enable the AI Auto-Trade agent via settings.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Scrip</th>
                          <th style={{ padding: '8px 10px' }}>Type</th>
                          <th style={{ padding: '8px 10px' }}>Qty</th>
                          <th style={{ padding: '8px 10px' }}>Avg Price</th>
                          <th style={{ padding: '8px 10px' }}>LTP</th>
                          <th style={{ padding: '8px 10px' }}>Unrealized P&L</th>
                          <th style={{ padding: '8px 10px' }}>SL / Target</th>
                          <th style={{ padding: '8px 10px' }}>Source</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos) => {
                          const isProfit = (pos.pnl || 0) >= 0;
                          return (
                            <tr key={pos.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '12px 10px', fontWeight: 700, color: '#fff' }}>
                                {pos.symbol}
                              </td>
                              <td style={{ padding: '12px 10px' }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 5px',
                                  borderRadius: '3px',
                                  background: 'var(--bg-bar)',
                                  color: pos.product_type === 'INTRADAY' ? 'var(--amber)' : 'var(--text-muted)'
                                }}>
                                  {pos.product_type || 'CNC'}
                                </span>
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', color: '#fff' }}>
                                {pos.qty}
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', color: 'var(--text-main)' }}>
                                ₹{pos.avg_price?.toFixed(2)}
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', fontWeight: 600, color: '#fff' }}>
                                ₹{pos.current_price?.toFixed(2)}
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', fontWeight: 700, color: isProfit ? 'var(--green)' : 'var(--red)' }}>
                                {isProfit ? '+' : ''}₹{pos.pnl?.toLocaleString('en-IN')}
                                <span className="tabular-nums" style={{ fontSize: '0.72rem', marginLeft: '4px', opacity: 0.85 }}>
                                  ({isProfit ? '+' : ''}{pos.pnl_pct?.toFixed(2)}%)
                                </span>
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <div>SL: {pos.stop_loss ? `₹${pos.stop_loss}` : '—'}</div>
                                <div>TP: {pos.target ? `₹${pos.target}` : '—'}</div>
                              </td>
                              <td style={{ padding: '12px 10px' }}>
                                <span className={`paper-badge ${pos.strategy_source === 'MANUAL' ? 'paper-badge-manual' : 'paper-badge-source'}`}>
                                  {pos.strategy_source || 'MANUAL'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleSquareOff(pos.symbol, pos)}
                                  aria-label={`Square off position in ${pos.symbol}`}
                                  style={{
                                    padding: '5px 10px',
                                    minHeight: '26px',
                                    borderRadius: '4px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255, 71, 87, 0.4)',
                                    background: 'rgba(255, 71, 87, 0.1)',
                                    color: 'var(--red)',
                                    cursor: 'pointer',
                                    touchAction: 'manipulation'
                                  }}
                                >
                                  Square Off
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: PENDING ORDERS ────────────────────────────────── */}
            {activeTab === 'pending' && (
              <div>
                {pendingOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>No Active Pending Orders</div>
                    <p style={{ fontSize: '0.8rem', maxWidth: '380px', margin: '6px auto 0' }}>
                      Limit, Stop-Loss (SL), and GTT orders waiting for market trigger will appear here.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Order ID</th>
                          <th style={{ padding: '8px 10px' }}>Scrip</th>
                          <th style={{ padding: '8px 10px' }}>Side</th>
                          <th style={{ padding: '8px 10px' }}>Type</th>
                          <th style={{ padding: '8px 10px' }}>Qty</th>
                          <th style={{ padding: '8px 10px' }}>Trigger / Price</th>
                          <th style={{ padding: '8px 10px' }}>Source</th>
                          <th style={{ padding: '8px 10px' }}>Time</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingOrders.map((ord) => (
                          <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                              {ord.id}
                            </td>
                            <td style={{ padding: '12px 10px', fontWeight: 700, color: '#fff' }}>
                              {ord.symbol}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{
                                fontWeight: 700,
                                color: ord.side === 'BUY' ? 'var(--green)' : 'var(--red)'
                              }}>
                                {ord.side}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--accent)', fontWeight: 600 }}>
                              {ord.order_type}
                            </td>
                            <td className="tabular-nums" style={{ padding: '12px 10px', color: '#fff' }}>
                              {ord.qty}
                            </td>
                            <td className="tabular-nums" style={{ padding: '12px 10px', color: '#fff' }}>
                              ₹{ord.trigger_price || ord.price}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span className="paper-badge paper-badge-source">
                                {ord.strategy_source || 'MANUAL'}
                              </span>
                            </td>
                            <td className="tabular-nums" style={{ padding: '12px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {ord.timestamp?.split(' ')[1] || ord.timestamp}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleCancelPending(ord.id)}
                                aria-label={`Cancel pending order ${ord.id}`}
                                style={{
                                  padding: '5px 10px',
                                  minHeight: '26px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg-bar)',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  touchAction: 'manipulation'
                                }}
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: CLOSED TRADES & STRATEGY DIVERGENCE ─────────────── */}
            {activeTab === 'trades' && (
              <div>
                {closedTrades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>No Closed Trades Yet</div>
                    <p style={{ fontSize: '0.8rem', maxWidth: '380px', margin: '6px auto 0' }}>
                      Completed trades, realized P&L, brokerage deductions, and strategy divergence flags will be recorded here.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Scrip</th>
                          <th style={{ padding: '8px 10px' }}>Qty</th>
                          <th style={{ padding: '8px 10px' }}>Entry Price</th>
                          <th style={{ padding: '8px 10px' }}>Exit Price</th>
                          {layoutConfig.showBrokerage && <th style={{ padding: '8px 10px' }}>Brokerage/Fees</th>}
                          <th style={{ padding: '8px 10px' }}>Net Realized P&L</th>
                          <th style={{ padding: '8px 10px' }}>Strategy Source</th>
                          <th style={{ padding: '8px 10px' }}>Exit Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.map((tr, idx) => {
                          const isWin = (tr.pnl || 0) >= 0;
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '12px 10px', fontWeight: 700, color: '#fff' }}>
                                {tr.symbol}
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', color: '#fff' }}>
                                {tr.qty}
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', color: 'var(--text-main)' }}>
                                ₹{tr.entry_price?.toFixed(2)}
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', color: 'var(--text-main)' }}>
                                ₹{tr.exit_price?.toFixed(2)}
                              </td>
                              {layoutConfig.showBrokerage && (
                                <td className="tabular-nums" style={{ padding: '12px 10px', color: 'var(--text-sub)' }}>
                                  ₹{tr.fees_paid ? tr.fees_paid.toFixed(2) : '0.00'}
                                </td>
                              )}
                              <td className="tabular-nums" style={{ padding: '12px 10px', fontWeight: 700, color: isWin ? 'var(--green)' : 'var(--red)' }}>
                                {isWin ? '+' : ''}₹{tr.pnl?.toLocaleString('en-IN')}
                                <span className="tabular-nums" style={{ fontSize: '0.72rem', marginLeft: '4px', opacity: 0.85 }}>
                                  ({isWin ? '+' : ''}{tr.pnl_pct?.toFixed(2)}%)
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="paper-badge paper-badge-source">
                                    {tr.strategy_source || 'MANUAL'}
                                  </span>
                                  {tr.divergence && (
                                    <span
                                      className="paper-badge paper-badge-divergence"
                                      title="Agent executed a strategy source outside the configured allowed list"
                                    >
                                      ⚠ Divergence
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="tabular-nums" style={{ padding: '12px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {tr.exit_time}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: ORDER LOG HISTORY ─────────────────────────────── */}
            {activeTab === 'history' && (
              <div>
                {ordersHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>No Orders Recorded</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Order ID</th>
                          <th style={{ padding: '8px 10px' }}>Scrip</th>
                          <th style={{ padding: '8px 10px' }}>Side</th>
                          <th style={{ padding: '8px 10px' }}>Type</th>
                          <th style={{ padding: '8px 10px' }}>Qty</th>
                          <th style={{ padding: '8px 10px' }}>Price</th>
                          <th style={{ padding: '8px 10px' }}>Status</th>
                          <th style={{ padding: '8px 10px' }}>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersHistory.map((ord, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                              {ord.id}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 700, color: '#fff' }}>
                              {ord.symbol}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 700, color: ord.side === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
                              {ord.side}
                            </td>
                            <td style={{ padding: '10px', color: 'var(--accent)' }}>
                              {ord.order_type || 'MARKET'}
                            </td>
                            <td className="tabular-nums" style={{ padding: '10px', color: '#fff' }}>
                              {ord.qty}
                            </td>
                            <td className="tabular-nums" style={{ padding: '10px', color: '#fff' }}>
                              ₹{ord.price}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontWeight: 700,
                                background: ord.status === 'EXECUTED' ? 'rgba(46, 213, 115, 0.15)' : (ord.status === 'PENDING' ? 'rgba(255, 165, 2, 0.15)' : 'rgba(255, 71, 87, 0.15)'),
                                color: ord.status === 'EXECUTED' ? 'var(--green)' : (ord.status === 'PENDING' ? 'var(--amber)' : 'var(--red)')
                              }}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="tabular-nums" style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {ord.timestamp}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 5: EQUITY CURVE (CUSTOMIZABLE) ──────────────────── */}
            {activeTab === 'equity' && layoutConfig.showEquityCurve && (
              <div>
                <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    PORTFOLIO EQUITY TRAJECTORY
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Starting Capital: ₹10,00,000 INR
                  </span>
                </div>

                {equityCurve.length < 2 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <TrendingUp size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>Accumulating Equity Data Points</div>
                    <p style={{ fontSize: '0.8rem', maxWidth: '380px', margin: '6px auto 0' }}>
                      Execute orders and monitor your portfolio to see historical equity trajectory updates.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* SVG Equity Line Chart */}
                    <div style={{
                      height: '240px',
                      width: '100%',
                      background: 'var(--bg-bar)',
                      borderRadius: '6px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      {(() => {
                        const values = equityCurve.map(e => e.portfolio_value);
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const range = max - min || 1;
                        const width = 600;
                        const height = 180;
                        const points = equityCurve.map((pt, i) => {
                          const x = (i / (equityCurve.length - 1)) * width;
                          const y = height - ((pt.portfolio_value - min) / range) * (height - 20) - 10;
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            <polyline
                              fill="none"
                              stroke="var(--accent)"
                              strokeWidth="2.5"
                              points={points}
                            />
                          </svg>
                        );
                      })()}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Start: {equityCurve[0]?.timestamp} (₹{equityCurve[0]?.portfolio_value.toLocaleString('en-IN')})</span>
                      <span>Latest: {equityCurve[equityCurve.length - 1]?.timestamp} (₹{equityCurve[equityCurve.length - 1]?.portfolio_value.toLocaleString('en-IN')})</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── AGENT SETTINGS / GUARDRAILS MODAL ───────────────────────────── */}
      {isSettingsOpen && (
        <div className="paper-modal-overlay">
          <div className="paper-modal-content">
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: 'var(--accent)' }} />
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  AI Agent Trading Guardrails & Configuration
                </h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close settings dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  minHeight: '28px',
                  minWidth: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              
              {/* Toggle 1: Auto-Trade Master Switch */}
              <div style={{
                background: 'var(--bg-bar)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    Autonomous AI Trading
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    When enabled, the AI Agent will auto-execute eligible setups matching your constraints.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={draftConfig.auto_trade_enabled}
                    onChange={(e) => setDraftConfig({ ...draftConfig, auto_trade_enabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '24px',
                    transition: '0.2s',
                    background: draftConfig.auto_trade_enabled ? 'var(--green)' : 'var(--border)'
                  }} />
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: draftConfig.auto_trade_enabled ? '23px' : '3px',
                    bottom: '3px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: '0.2s'
                  }} />
                </label>
              </div>

              {/* Strategy Sources Permitted */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Permitted Strategy Sources
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {STRATEGY_SOURCE_OPTIONS.map((opt) => {
                    const isChecked = (draftConfig.allowed_strategies || []).includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          const current = draftConfig.allowed_strategies || [];
                          const updated = isChecked ? current.filter(x => x !== opt.id) : [...current, opt.id];
                          setDraftConfig({ ...draftConfig, allowed_strategies: updated });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          background: isChecked ? 'rgba(0, 212, 170, 0.08)' : 'var(--bg-bar)',
                          border: `1px solid ${isChecked ? 'rgba(0, 212, 170, 0.3)' : 'var(--border)'}`,
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          style={{ marginTop: '3px', accentColor: 'var(--accent)' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{opt.label}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk Limits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Max Capital Allocation (₹)
                  </label>
                  <input
                    type="number"
                    value={draftConfig.max_capital_allocation}
                    onChange={(e) => setDraftConfig({ ...draftConfig, max_capital_allocation: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-bar)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Max Allocation / Trade (%)
                  </label>
                  <input
                    type="number"
                    value={draftConfig.max_allocation_per_trade_pct}
                    onChange={(e) => setDraftConfig({ ...draftConfig, max_allocation_per_trade_pct: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-bar)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Max Positions
                  </label>
                  <input
                    type="number"
                    value={draftConfig.max_open_positions}
                    onChange={(e) => setDraftConfig({ ...draftConfig, max_open_positions: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-bar)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Default SL (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={draftConfig.default_stop_loss_pct}
                    onChange={(e) => setDraftConfig({ ...draftConfig, default_stop_loss_pct: parseFloat(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-bar)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Default Target (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={draftConfig.default_target_pct}
                    onChange={(e) => setDraftConfig({ ...draftConfig, default_target_pct: parseFloat(e.target.value) || 2 })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-bar)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '8px 10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Minimum Confidence Score (0-100)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={draftConfig.min_confidence_score}
                  onChange={(e) => setDraftConfig({ ...draftConfig, min_confidence_score: parseInt(e.target.value) || 75 })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-bar)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '14px 20px',
              borderTop: '1px solid var(--border)'
            }}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'var(--bg-bar)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAgentConfig}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  background: 'var(--accent)',
                  color: '#000',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                Save Guardrails
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
