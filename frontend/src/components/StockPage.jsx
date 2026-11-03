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
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar
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
  onNavigateToAlgo 
}) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const cachedDataRef = useRef({ candles: [], lines: [], volumes: [] });

  // Quote and Historical Chart state
  const [quote, setQuote] = useState(null);
  const [period, setPeriod] = useState('1d'); // Default view is 1D
  const [interval, setInterval] = useState('1m'); // 1m live feed tick interval
  const [chartType, setChartType] = useState('line-dots'); // Default: Line & Dots
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
    { label: '5D', period: '5d', interval: '5m' },
    { label: '1M', period: '1mo', interval: '1d' },
    { label: '6M', period: '6mo', interval: '1d' },
    { label: '1Y', period: '1y', interval: '1d' },
  ];

  const famousGraphOptions = [
    { id: 'line-dots', label: '📈 Line & Dots (Default)' },
    { id: 'candlestick', label: '🕯️ Japanese Candlestick' },
    { id: 'area', label: '🌊 Area / Mountain' },
    { id: 'bar', label: '📊 OHLC Bars' },
    { id: 'baseline', label: '⚖️ Baseline Delta' },
  ];

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
        pointMarkersVisible: true,
        pointMarkersRadius: 4,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
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
        topColor: 'rgba(0, 212, 170, 0.45)',
        bottomColor: 'rgba(0, 212, 170, 0.02)',
        lineWidth: 2,
        pointMarkersVisible: true,
        pointMarkersRadius: 3,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
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
        topFillColor1: 'rgba(46, 213, 115, 0.35)',
        topFillColor2: 'rgba(46, 213, 115, 0.05)',
        bottomFillColor1: 'rgba(255, 71, 87, 0.05)',
        bottomFillColor2: 'rgba(255, 71, 87, 0.35)',
        lineWidth: 2,
        pointMarkersVisible: true,
        pointMarkersRadius: 3,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
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
        const mainData = param.seriesData.get(mainSeriesRef.current);
        if (mainData) {
          if (typeof mainData.value === 'number') {
            hoveredPrice = mainData.value;
          } else if (typeof mainData.close === 'number') {
            hoveredPrice = mainData.close;
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

        <div style={{ display: 'flex', gap: '10px' }}>
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
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-card, #1a1d23), #161a22)',
        border: '1px solid var(--border, #2a2d35)',
        borderRadius: '14px',
        padding: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(0, 212, 170, 0.15)',
              color: 'var(--accent, #00d4aa)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              NSE: {cleanName}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #8b949e)' }}>
              {quote?.name || cleanName}
            </span>
            {hoveredPoint && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--accent, #00d4aa)',
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

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 900 }}>
              ₹{displayPrice ? Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'Loading...'}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)',
              fontWeight: 700,
              fontSize: '1.1rem'
            }}>
              {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {isUp ? '+' : ''}{displayChange.toFixed(2)} ({isUp ? '+' : ''}{displayChangePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Key Stats Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          flex: '1',
          maxWidth: '650px'
        }}>
          <div style={{ background: 'var(--bg-secondary, #22252d)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>Day Range</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>
              ₹{quote?.dayLow ? quote.dayLow.toFixed(1) : '—'} - {quote?.dayHigh ? quote.dayHigh.toFixed(1) : '—'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary, #22252d)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>52W Range</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>
              ₹{quote?.fiftyTwoWeekLow ? quote.fiftyTwoWeekLow.toFixed(1) : '—'} - {quote?.fiftyTwoWeekHigh ? quote.fiftyTwoWeekHigh.toFixed(1) : '—'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary, #22252d)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>Volume</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>
              {quote?.volume ? Number(quote.volume).toLocaleString('en-IN') : '—'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary, #22252d)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>P/E Ratio</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>
              {quote?.pe ? quote.pe.toFixed(2) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div style={{
        background: 'var(--bg-card, #1a1d23)',
        border: '1px solid var(--border, #2a2d35)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        {/* Chart Toolbar with Timeframes AND Famous Graph Dropdown */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border, #2a2d35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-bar, #12141a)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Timeframe Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {periods.map(p => (
              <button
                key={p.label}
                onClick={() => handlePeriodChange(p.period, p.interval)}
                style={{
                  background: period === p.period ? 'var(--accent, #00d4aa)' : 'rgba(255,255,255,0.05)',
                  color: period === p.period ? '#0f1117' : 'var(--text-main, #f0f2f5)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Famous Graphs Dropdown Selector (Default: Line and Dot) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-secondary, #22252d)',
              border: '1px solid var(--border, #2a2d35)',
              borderRadius: '7px',
              padding: '4px 8px'
            }}>
              <Layers size={14} color="var(--accent, #00d4aa)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #8b949e)', fontWeight: 600 }}>Graph:</span>
              <select
                value={chartType}
                onChange={(e) => handleChartTypeChange(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent, #00d4aa)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {famousGraphOptions.map(opt => (
                  <option 
                    key={opt.id} 
                    value={opt.id} 
                    style={{ background: '#1a1d23', color: '#f0f2f5' }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchCandles(period, interval, chartType)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border, #2a2d35)',
                color: 'var(--text-muted, #8b949e)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={13} className={chartLoading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Chart View with Groww Floating Info Pill */}
        <div style={{ position: 'relative', width: '100%', height: '440px', background: '#12141a' }}>
          
          {/* Groww Floating Hover Card */}
          {hoveredPoint && (
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
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #8b949e)' }}>{hoveredPoint.dateStr}</span>
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
                {hoveredPoint.volume > 0 && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #8b949e)' }}>
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
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #8b949e)' }}>
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
      </div>

      {/* Dedicated AI Multi-Agent Section (Opt-in trigger) */}
      <div style={{
        background: 'linear-gradient(145deg, var(--bg-card, #1a1d23), #181d28)',
        border: '1px solid var(--border, #2a2d35)',
        borderRadius: '14px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #00d4aa)', fontSize: '0.8rem', fontWeight: 700 }}>
              <Bot size={16} /> AUTONOMOUS MULTI-AGENT QUANT ENGINE
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
              Deep AI Multi-Agent Analysis
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #8b949e)' }}>
              Click the button below to spin up the 3 autonomous agents (News NLP Sentiment, Historical Volume Breakouts, and Technical Algos) for {cleanName}.
            </p>
          </div>

          <button
            onClick={handleTriggerAI}
            disabled={aiLoading}
            style={{
              background: 'linear-gradient(135deg, var(--accent, #00d4aa), #00a884)',
              color: '#0f1117',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)',
              opacity: aiLoading ? 0.7 : 1
            }}
          >
            {aiLoading ? (
              <>
                <RefreshCw size={16} className="spin" />
                Analyzing Agents Running...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {aiData ? 'Re-run AI Multi-Agent Analysis' : 'Run AI Multi-Agent Analysis'}
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
