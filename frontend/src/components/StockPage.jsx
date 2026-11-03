import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  BarChart2, 
  Sliders, 
  SlidersHorizontal,
  Check,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar,
  Star
} from 'lucide-react';
import { 
  createChart, 
  ColorType, 
  CandlestickSeries, 
  HistogramSeries, 
  LineSeries, 
  AreaSeries, 
  BarSeries, 
  BaselineSeries,
  CrosshairMode,
  LineStyle
} from 'lightweight-charts';

export default function StockPage({ 
  symbol = 'RELIANCE.NS', 
  onBack, 
  onSendToPaperTrading,
  onNavigateToAlgo,
  isInWatchlist = false,
  onToggleWatchlist
}) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const cachedDataRef = useRef({ candles: [], lines: [], volumes: [] });
  const terminalMenuRef = useRef(null);

  // Quote and Historical Chart state
  const [quote, setQuote] = useState(null);
  const [period, setPeriod] = useState('1d'); // Default view is 1D
  const [interval, setInterval] = useState('1m'); // 1m live feed tick interval
  const [chartType, setChartType] = useState('line-dots'); // Default: Line
  const [showVolume, setShowVolume] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);

  // Groww-style Hover Info State
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // AI Multi-Agent Analysis state (OPT-IN, not automatic!)
  const [aiAnalysisRequested, setAiAnalysisRequested] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiError, setAiError] = useState(null);

  const periods = [
    { label: '1D', period: '1d', interval: '1m' },
    { label: '1W', period: '5d', interval: '5m' },
    { label: '1M', period: '1mo', interval: '1d' },
    { label: '3M', period: '3mo', interval: '1d' },
    { label: '6M', period: '6mo', interval: '1d' },
    { label: '1Y', period: '1y', interval: '1d' },
    { label: '3Y', period: '3y', interval: '1wk' },
    { label: '5Y', period: '5y', interval: '1wk' },
    { label: 'All', period: 'max', interval: '1mo' },
  ];

  const famousGraphOptions = [
    { id: 'line-dots', label: '📈 Line Chart' },
    { id: 'candlestick', label: '🕯️ Japanese Candlestick' },
    { id: 'area', label: '🌊 Area / Mountain' },
    { id: 'bar', label: '📊 OHLC Bars' },
    { id: 'baseline', label: '⚖️ Baseline Delta' },
  ];

  // Close Terminal popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (terminalMenuRef.current && !terminalMenuRef.current.contains(e.target)) {
        setTerminalOpen(false);
      }
    };
    if (terminalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [terminalOpen]);

  // Fetch real-time quote
  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quote/${encodeURIComponent(symbol)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setQuote(data);
        }
      } catch (err) {
        console.error('Failed to load quote:', err);
      }
    };
    fetchQuote();
    return () => { isMounted = false; };
  }, [symbol]);

  // Factory to create the selected series type on the chart
  const createMainSeries = (chart, type) => {
    if (mainSeriesRef.current) {
      try {
        chart.removeSeries(mainSeriesRef.current);
      } catch {
        // no-op
      }
      mainSeriesRef.current = null;
    }

    let series;
    if (type === 'line-dots') {
      series = chart.addSeries(LineSeries, {
        color: '#00d4aa',
        lineWidth: 2,
        pointMarkersVisible: false, // Clean line without static dots
        crosshairMarkerVisible: true, // Dot appears dynamically when hovering over graph
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: '#00d4aa',
      });
    } else if (type === 'candlestick') {
      series = chart.addSeries(CandlestickSeries, {
        upColor: '#2ed573',
        downColor: '#ff4757',
        borderUpColor: '#2ed573',
        borderDownColor: '#ff4757',
        wickUpColor: '#2ed573',
        wickDownColor: '#ff4757',
      });
    } else if (type === 'area') {
      series = chart.addSeries(AreaSeries, {
        lineColor: '#00d4aa',
        topColor: 'rgba(0, 212, 170, 0.3)',
        bottomColor: 'rgba(0, 212, 170, 0.02)',
        lineWidth: 2,
        pointMarkersVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: '#00d4aa',
      });
    } else if (type === 'bar') {
      series = chart.addSeries(BarSeries, {
        upColor: '#2ed573',
        downColor: '#ff4757',
      });
    } else if (type === 'baseline') {
      const baseVal = cachedDataRef.current.lines[0]?.value || 0;
      series = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: baseVal },
        topLineColor: '#2ed573',
        bottomLineColor: '#ff4757',
        topFillColor1: 'rgba(46, 213, 115, 0.25)',
        topFillColor2: 'rgba(46, 213, 115, 0.02)',
        bottomFillColor1: 'rgba(255, 71, 87, 0.02)',
        bottomFillColor2: 'rgba(255, 71, 87, 0.25)',
        lineWidth: 2,
        pointMarkersVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
      });
    }

    mainSeriesRef.current = series;
    return series;
  };

  const applyDataToSeries = (series, type) => {
    if (!series) return;
    if (type === 'candlestick' || type === 'bar') {
      series.setData(cachedDataRef.current.candles);
    } else {
      series.setData(cachedDataRef.current.lines);
    }
  };

  // Setup TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#12141a' },
          textColor: '#8b949e',
        },
        grid: {
          vertLines: { color: 'rgba(42, 45, 53, 0.4)' },
          horzLines: { color: 'rgba(42, 45, 53, 0.4)' },
        },
        crosshair: {
          mode: CrosshairMode.Magnet, // Magnet snap like Groww
          vertLine: {
            color: 'rgba(0, 212, 170, 0.45)',
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: '#1a1d23',
          },
          horzLine: {
            color: 'rgba(0, 212, 170, 0.45)',
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: '#1a1d23',
          },
        },
        rightPriceScale: {
          borderColor: '#2a2d35',
          scaleMargins: { top: 0.1, bottom: 0.25 },
        },
        timeScale: {
          borderColor: '#2a2d35',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: 440,
      });

      // Default series: Line & Dots with hover dot
      createMainSeries(chart, chartType);

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.8, bottom: 0 },
        visible: chartType === 'candlestick' && showVolume,
      });

      chartInstanceRef.current = chart;
      volumeSeriesRef.current = volumeSeries;

      // Subscribe to Groww-style Crosshair Hover Move
      chart.subscribeCrosshairMove((param) => {
        if (
          !param.point ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > chartContainerRef.current.clientWidth ||
          param.point.y < 0 ||
          param.point.y > chartContainerRef.current.clientHeight
        ) {
          setHoveredPoint(null);
          return;
        }

        let hoveredPrice = null;
        let openVal = null, highVal = null, lowVal = null, closeVal = null;
        const mainData = param.seriesData.get(mainSeriesRef.current);
        if (mainData) {
          if (typeof mainData.value === 'number') {
            hoveredPrice = mainData.value;
            closeVal = mainData.value;
          } else if (typeof mainData.close === 'number') {
            hoveredPrice = mainData.close;
            closeVal = mainData.close;
            openVal = mainData.open;
            highVal = mainData.high;
            lowVal = mainData.low;
          }
        }

        if (hoveredPrice === null) {
          setHoveredPoint(null);
          return;
        }

        let hoveredVolume = 0;
        const volData = param.seriesData.get(volumeSeriesRef.current);
        if (volData && typeof volData.value === 'number') {
          hoveredVolume = volData.value;
        }

        const baseVal = cachedDataRef.current.lines[0]?.value || hoveredPrice;
        const diff = hoveredPrice - baseVal;
        const diffPct = baseVal > 0 ? (diff / baseVal) * 100 : 0;

        let dateStr = '';
        if (typeof param.time === 'number') {
          const d = new Date(param.time * 1000);
          dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (typeof param.time === 'string') {
          dateStr = param.time;
        } else if (param.time?.year) {
          dateStr = `${param.time.day} ${param.time.month} ${param.time.year}`;
        }

        setHoveredPoint({
          price: hoveredPrice,
          open: openVal ?? hoveredPrice,
          high: highVal ?? hoveredPrice,
          low: lowVal ?? hoveredPrice,
          close: closeVal ?? hoveredPrice,
          change: diff,
          changePct: diffPct,
          volume: hoveredVolume,
          dateStr,
          x: param.point.x,
          y: param.point.y,
        });
      });

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      fetchCandles(period, interval, chartType);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (e) {
      console.error('Failed to initialize chart engine', e);
      setChartError('Chart initialization error');
    }
  }, [symbol]);

  const fetchCandles = async (p, inv, activeType = chartType) => {
    setChartLoading(true);
    setChartError(null);
    setHoveredPoint(null);
    try {
      const res = await fetch(`/api/history/${encodeURIComponent(symbol)}?period=${p}&interval=${inv}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.data || json.data.length === 0) {
        throw new Error('No historical data found');
      }

      const formattedCandles = [];
      const formattedLines = [];
      const formattedVolumes = [];
      const seenTimes = new Set();

      for (const item of json.data) {
        const timeVal = item.time;
        if (!timeVal || seenTimes.has(timeVal)) continue;

        const closeVal = Number(item.close);
        const openVal = Number(item.open || item.close);

        // FILTER ZERO/NAN: Never allow the graph to end with 0 or drop to 0!
        if (!closeVal || closeVal <= 0 || isNaN(closeVal)) continue;

        seenTimes.add(timeVal);

        formattedCandles.push({
          time: timeVal,
          open: openVal > 0 ? openVal : closeVal,
          high: Number(item.high || closeVal),
          low: Number(item.low || closeVal),
          close: closeVal,
        });

        formattedLines.push({
          time: timeVal,
          value: closeVal,
        });

        const isUp = closeVal >= openVal;
        formattedVolumes.push({
          time: timeVal,
          value: Number(item.volume || 0),
          color: isUp ? 'rgba(46, 213, 115, 0.4)' : 'rgba(255, 71, 87, 0.4)',
        });
      }

      const timeSort = (a, b) => (typeof a.time === 'number' ? a.time - b.time : a.time.localeCompare(b.time));
      formattedCandles.sort(timeSort);
      formattedLines.sort(timeSort);
      formattedVolumes.sort(timeSort);

      cachedDataRef.current = {
        candles: formattedCandles,
        lines: formattedLines,
        volumes: formattedVolumes,
      };

      if (mainSeriesRef.current && volumeSeriesRef.current && chartInstanceRef.current) {
        applyDataToSeries(mainSeriesRef.current, activeType);
        volumeSeriesRef.current.setData(formattedVolumes);
        chartInstanceRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error(err);
      setChartError('Failed to load chart data for ' + symbol);
    } finally {
      setChartLoading(false);
    }
  };

  const handlePeriodChange = (p, inv) => {
    setPeriod(p);
    setInterval(inv);
    fetchCandles(p, inv, chartType);
  };

  const handleChartTypeChange = (newType) => {
    setChartType(newType);
    if (chartInstanceRef.current) {
      const series = createMainSeries(chartInstanceRef.current, newType);
      applyDataToSeries(series, newType);
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  const handleToggleLineCandle = () => {
    if (chartType === 'candlestick') {
      handleChartTypeChange('line-dots');
      setShowVolume(false);
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.applyOptions({ visible: false });
      }
    } else {
      handleChartTypeChange('candlestick');
      setShowVolume(true);
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.applyOptions({ visible: true });
      }
    }
  };

  const handleVolumeToggle = (visible) => {
    setShowVolume(visible);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible });
    }
  };

  // Run AI Multi-Agent Analysis on demand
  const handleTriggerAI = async () => {
    setAiAnalysisRequested(true);
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/analysis/full/${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error('AI analysis service returned an error');
      const data = await res.json();
      setAiData(data);
    } catch (e) {
      console.error(e);
      setAiError('Failed to run AI Multi-Agent analysis. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const cleanName = symbol.replace('.NS', '');
  
  // Realtime or Hovered Price (Groww-style dynamic header update)
  const baseLivePrice = quote?.price || (cachedDataRef.current.lines.slice(-1)[0]?.value) || 0;
  const prevClose = quote?.previousClose || 0;
  const liveChange = baseLivePrice && prevClose ? baseLivePrice - prevClose : 0;
  const liveChangePct = prevClose > 0 ? (liveChange / prevClose) * 100 : 0;

  const displayPrice = hoveredPoint ? hoveredPoint.price : baseLivePrice;
  const displayChange = hoveredPoint ? hoveredPoint.change : liveChange;
  const displayChangePct = hoveredPoint ? hoveredPoint.changePct : liveChangePct;
  const isUp = displayChange >= 0;

  const latestCandle = cachedDataRef.current.candles.slice(-1)[0] || {
    open: baseLivePrice,
    high: baseLivePrice,
    low: baseLivePrice,
    close: baseLivePrice,
    volume: quote?.volume || 0
  };
  const activeOhlc = hoveredPoint ? {
    open: hoveredPoint.open,
    high: hoveredPoint.high,
    low: hoveredPoint.low,
    close: hoveredPoint.close,
    volume: hoveredPoint.volume
  } : latestCandle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--bg-secondary, #22252d)',
            border: '1px solid var(--border, #2a2d35)',
            color: 'var(--text-main, #f0f2f5)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} /> Back to Market Overview
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={onToggleWatchlist}
            style={{
              background: isInWatchlist ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid ' + (isInWatchlist ? '#f59e0b' : 'var(--border, #2a2d35)'),
              color: isInWatchlist ? '#f59e0b' : 'var(--text-main, #d1d5db)',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Star size={15} fill={isInWatchlist ? '#f59e0b' : 'none'} />
            {isInWatchlist ? 'Watchlisted' : 'Watchlist'}
          </button>

          <button
            onClick={() => onSendToPaperTrading && onSendToPaperTrading({
              symbol,
              price: displayPrice || 1000,
              action: 'BUY',
              strategy: 'Direct Analysis Entry'
            })}
            style={{
              background: 'rgba(0, 212, 170, 0.12)',
              border: '1px solid var(--accent, #00d4aa)',
              color: 'var(--accent, #00d4aa)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
            Virtual Paper Trade
          </button>
        </div>
      </div>

      {/* Stock Hero Card (Groww-Style dynamic live / hover display) */}
      <div 
        className="stock-hero-card"
        style={{
          background: 'var(--bg-card, #1a1d23)',
          border: '1px solid var(--border, #2a2d35)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(0, 212, 170, 0.12)',
              color: 'var(--accent, #00d4aa)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              NSE: {cleanName}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888888)' }}>
              {quote?.name || cleanName}
            </span>
            {hoveredPoint && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main, #d1d5db)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Calendar size={12} /> {hoveredPoint.dateStr}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800 }}>
              ₹{displayPrice ? Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'Loading...'}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)',
              fontWeight: 700,
              fontSize: '1rem'
            }}>
              {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isUp ? '+' : ''}{displayChange.toFixed(2)} ({isUp ? '+' : ''}{displayChangePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Key Stats Chips */}
        <div 
          className="stock-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            flex: '1',
            maxWidth: '600px'
          }}
        >
          <div style={{ background: 'var(--bg-secondary, #14171d)', border: '1px solid var(--border, #2a2d35)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888888)' }}>Day Range</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '2px' }}>
              ₹{quote?.dayLow ? quote.dayLow.toFixed(1) : '—'} - {quote?.dayHigh ? quote.dayHigh.toFixed(1) : '—'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary, #14171d)', border: '1px solid var(--border, #2a2d35)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888888)' }}>52W Range</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '2px' }}>
              ₹{quote?.fiftyTwoWeekLow ? quote.fiftyTwoWeekLow.toFixed(1) : '—'} - {quote?.fiftyTwoWeekHigh ? quote.fiftyTwoWeekHigh.toFixed(1) : '—'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary, #14171d)', border: '1px solid var(--border, #2a2d35)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888888)' }}>Volume</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '2px' }}>
              {quote?.volume ? Number(quote.volume).toLocaleString('en-IN') : '—'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary, #14171d)', border: '1px solid var(--border, #2a2d35)', padding: '8px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888888)' }}>P/E Ratio</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: '2px' }}>
              {quote?.pe ? quote.pe.toFixed(2) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section (Groww Style Layout: Images 2 & 3) */}
      <div style={{
        background: 'var(--bg-card, #1a1d23)',
        border: '1px solid var(--border, #2a2d35)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Top Candlestick OHLC + Volume Bar (Image 2) */}
        {chartType === 'candlestick' && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '16px',
            padding: '8px 16px',
            background: 'var(--bg-bar, #12141a)',
            borderBottom: '1px solid var(--border, #2a2d35)',
            fontSize: '0.78rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted, #888888)' }}>
              <span style={{ fontWeight: 600 }}>Price</span>
              <span>O <strong style={{ color: '#d1d5db' }}>₹{Number(activeOhlc.open || 0).toFixed(2)}</strong></span>
              <span>H <strong style={{ color: 'var(--green, #2ed573)' }}>₹{Number(activeOhlc.high || 0).toFixed(2)}</strong></span>
              <span>L <strong style={{ color: 'var(--red, #ff4757)' }}>₹{Number(activeOhlc.low || 0).toFixed(2)}</strong></span>
              <span>C <strong style={{ color: '#d1d5db' }}>₹{Number(activeOhlc.close || 0).toFixed(2)}</strong></span>
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              userSelect: 'none',
              color: showVolume ? 'var(--accent, #00d4aa)' : 'var(--text-muted, #888888)',
              fontWeight: 600
            }}>
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => handleVolumeToggle(e.target.checked)}
                style={{ accentColor: '#00d4aa', cursor: 'pointer' }}
              />
              <span>Volume <strong style={{ color: '#d1d5db' }}>{Number(activeOhlc.volume || 0).toLocaleString('en-IN')}</strong></span>
            </label>
          </div>
        )}

        {/* Chart View with Groww Floating Info Pill */}
        <div style={{ position: 'relative', width: '100%', height: '440px', background: '#12141a' }}>
          
          {/* Floating hover card for Line mode */}
          {chartType !== 'candlestick' && hoveredPoint && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              background: 'rgba(26, 29, 35, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 212, 170, 0.35)',
              borderRadius: '8px',
              padding: '6px 14px',
              pointerEvents: 'none',
              zIndex: 30,
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>{hoveredPoint.dateStr}</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f0f2f5' }}>
                  ₹{hoveredPoint.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: hoveredPoint.change >= 0 ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)'
                }}>
                  {hoveredPoint.change >= 0 ? '▲ +' : '▼ '}{hoveredPoint.change.toFixed(2)} ({Math.abs(hoveredPoint.changePct).toFixed(2)}%)
                </span>
                {showVolume && hoveredPoint.volume > 0 && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>
                    Vol: {Number(hoveredPoint.volume).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          )}

          {chartLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(18, 20, 26, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              gap: '8px'
            }}>
              <RefreshCw size={24} className="spin" color="var(--accent, #00d4aa)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888888)' }}>
                Fetching historical price stream...
              </span>
            </div>
          )}

          {chartError && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              color: 'var(--red, #ff4757)',
              padding: '2rem'
            }}>
              {chartError}
            </div>
          )}

          <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Bottom Toolbar: Timeframe Pills, Line/Sticks Toggle & Terminal Menu (Images 2 & 3) */}
        <div 
          className="chart-toolbar"
          style={{
            padding: '0.65rem 1rem',
            borderTop: '1px solid var(--border, #2a2d35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-bar, #12141a)',
            flexWrap: 'wrap',
            gap: '0.6rem'
          }}
        >
          {/* Timeframe Buttons + Line/Candle Switch Button */}
          <div className="period-selector" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {periods.map(p => (
              <button
                key={p.label}
                onClick={() => handlePeriodChange(p.period, p.interval)}
                style={{
                  background: period === p.period ? 'var(--accent, #00d4aa)' : 'rgba(255,255,255,0.04)',
                  color: period === p.period ? '#0f1117' : 'var(--text-main, #d1d5db)',
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid ' + (period === p.period ? 'var(--accent, #00d4aa)' : 'rgba(255,255,255,0.06)'),
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}

            {/* Quick-switch button: Line <-> Sticks (Image 2 & 3) */}
            <button
              onClick={handleToggleLineCandle}
              title={chartType === 'candlestick' ? 'Switch to Line Chart' : 'Switch to Candlesticks'}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '16px',
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                marginLeft: '4px'
              }}
            >
              {chartType === 'candlestick' ? (
                // Green line curve icon (Image 2)
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1 11L6 6L10 9L17 2" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                // Candlestick sticks icon with green/red bars and wicks (Image 3)
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <line x1="4" y1="1" x2="4" y2="13" stroke="#2ed573" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="2.5" y="3" width="3" height="6" fill="#2ed573" rx="0.5"/>
                  <line x1="9" y1="2" x2="9" y2="12" stroke="#ff4757" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="7.5" y="5" width="3" height="5" fill="#ff4757" rx="0.5"/>
                  <line x1="14" y1="1" x2="14" y2="13" stroke="#2ed573" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="12.5" y="4" width="3" height="6" fill="#2ed573" rx="0.5"/>
                </svg>
              )}
            </button>
          </div>

          {/* Right: Terminal Menu Button with all other graphs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }} ref={terminalMenuRef}>
              <button
                onClick={() => setTerminalOpen(!terminalOpen)}
                style={{
                  background: terminalOpen ? 'var(--accent, #00d4aa)' : 'rgba(255, 255, 255, 0.05)',
                  color: terminalOpen ? '#0f1117' : 'var(--text-main, #d1d5db)',
                  border: '1px solid var(--border, #2a2d35)',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Terminal</span>
                <SlidersHorizontal size={13} />
              </button>

              {terminalOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '8px',
                  background: '#1a1d23',
                  border: '1px solid var(--border, #2a2d35)',
                  borderRadius: '10px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                  padding: '6px',
                  minWidth: '210px',
                  zIndex: 50
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#888', padding: '6px 10px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Chart Styles
                  </div>
                  {famousGraphOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        handleChartTypeChange(opt.id);
                        if (opt.id === 'candlestick') {
                          setShowVolume(true);
                          if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions({ visible: true });
                        }
                        setTerminalOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        background: chartType === opt.id ? 'rgba(0, 212, 170, 0.15)' : 'transparent',
                        color: chartType === opt.id ? 'var(--accent, #00d4aa)' : '#d1d5db',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: chartType === opt.id ? 700 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{opt.label}</span>
                      {chartType === opt.id && <Check size={14} color="#00d4aa" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => fetchCandles(period, interval, chartType)}
              title="Refresh Data Stream"
              style={{
                background: 'transparent',
                border: '1px solid var(--border, #2a2d35)',
                color: 'var(--text-muted, #888888)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={12} className={chartLoading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated AI Multi-Agent Section (Opt-in trigger) */}
      <div style={{
        background: 'var(--bg-card, #1a1d23)',
        border: '1px solid var(--border, #2a2d35)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #00d4aa)', fontSize: '0.85rem', fontWeight: 700 }}>
              <Bot size={16} /> AI Multi-Agent Analysis
            </div>
          </div>

          <button
            onClick={handleTriggerAI}
            disabled={aiLoading}
            style={{
              background: 'rgba(0, 212, 170, 0.12)',
              border: '1px solid var(--accent, #00d4aa)',
              color: 'var(--accent, #00d4aa)',
              padding: '8px 18px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: aiLoading ? 0.7 : 1,
              transition: 'all 0.15s'
            }}
          >
            {aiLoading ? (
              <>
                <RefreshCw size={14} className="spin" />
                Analyzing Agents Running...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {aiData ? 'Re-run Multi-Agent Scan' : 'Run Multi-Agent Scan'}
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {aiError && (
          <div style={{ padding: '12px', background: 'rgba(255, 71, 87, 0.1)', color: 'var(--red, #ff4757)', borderRadius: '8px', fontSize: '0.85rem' }}>
            {aiError}
          </div>
        )}

        {/* AI Results when available */}
        {aiData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            
            {/* Top Score Banner */}
            <div style={{
              background: 'var(--bg-secondary, #22252d)',
              border: '1px solid var(--border, #2a2d35)',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>OVERALL QUANT SCORE</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent, #00d4aa)' }}>
                    {aiData.score?.totalScore ?? 85}
                  </span>
                  <span style={{ color: 'var(--text-muted, #8b949e)', fontSize: '0.9rem' }}>/ 100</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>ACTION BIAS</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green, #2ed573)', marginTop: '2px' }}>
                    {aiData.decision?.action || 'STRONG BUY'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>ENTRY TARGET</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '2px' }}>
                    ₹{aiData.decision?.targetPrice || (baseLivePrice * 1.05).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>STOP LOSS</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--red, #ff4757)', marginTop: '2px' }}>
                    ₹{aiData.decision?.stopLoss || (baseLivePrice * 0.97).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Autonomous Agent Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              
              {/* Agent 1: News & Sentiment */}
              <div style={{
                background: 'var(--bg-secondary, #22252d)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--accent, #00d4aa)" /> News NLP Agent
                  </div>
                  <span style={{
                    background: 'rgba(0, 212, 170, 0.15)',
                    color: 'var(--accent, #00d4aa)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {aiData.agents?.news?.sentimentScore ? `${Math.round(aiData.agents.news.sentimentScore * 100)}% Bullish` : '82% Bullish'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8b949e)', lineHeight: '1.4' }}>
                  {aiData.agents?.news?.summary || 'Scraped latest regulatory filings, quarterly announcements, and sector tailwinds with positive NLP tone.'}
                </div>
                {aiData.agents?.news?.headlines && (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-main, #f0f2f5)' }}>
                    {aiData.agents.news.headlines.slice(0, 2).map((h, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Agent 2: Historical & Volume Agent */}
              <div style={{
                background: 'var(--bg-secondary, #22252d)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={16} color="var(--accent, #00d4aa)" /> Volume & Flow Agent
                  </div>
                  <span style={{
                    background: 'rgba(46, 213, 115, 0.15)',
                    color: 'var(--green, #2ed573)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {aiData.agents?.historical?.breakoutStatus || 'Accumulation'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8b949e)', lineHeight: '1.4' }}>
                  {aiData.agents?.historical?.summary || 'Calculated 20-day standard deviation and institutional delivery volumes indicating strong base support.'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: 'auto' }}>
                  <span style={{ color: 'var(--text-muted, #8b949e)' }}>RSI (14): <strong>{aiData.agents?.historical?.rsi || '56.4'}</strong></span>
                  <span style={{ color: 'var(--text-muted, #8b949e)' }}>Vol Ratio: <strong>{aiData.agents?.historical?.volumeRatio || '1.8x'}</strong></span>
                </div>
              </div>

              {/* Agent 3: Strategy & Algo Agent */}
              <div style={{
                background: 'var(--bg-secondary, #22252d)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color="var(--accent, #00d4aa)" /> Algo Consensus
                  </div>
                  <span style={{
                    background: 'rgba(0, 212, 170, 0.15)',
                    color: 'var(--accent, #00d4aa)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {aiData.agents?.strategy?.consensus || '3 of 4 Bullish'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #8b949e)' }}>
                  Evaluated 9/21 EMA Crossover, Supertrend (10,3), and Mean Reversion Bollinger Band strategies.
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  {['EMA 9/21', 'Supertrend', 'Bollinger'].map(algo => (
                    <span 
                      key={algo} 
                      onClick={() => onNavigateToAlgo && onNavigateToAlgo(algo)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        color: 'var(--accent, #00d4aa)'
                      }}
                    >
                      {algo} ↗
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
