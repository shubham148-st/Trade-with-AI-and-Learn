import React, { useEffect, useRef, useState } from 'react';
import { X, TrendingUp, TrendingDown, Maximize2, RefreshCw, Layers, Calendar } from 'lucide-react';
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

export default function NiftyModal({ symbol = '^NSEI', title = 'NIFTY 50 Benchmark', onClose }) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const cachedDataRef = useRef({ candles: [], lines: [], volumes: [] });

  const [period, setPeriod] = useState('1d'); // Default view is 1D
  const [interval, setInterval] = useState('1m'); // 1m live feed tick interval
  const [chartType, setChartType] = useState('line-dots'); // Default: Line & Dots
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

  const fetchChartData = async (selectedPeriod, selectedInterval, activeType = chartType) => {
    setLoading(true);
    setError(null);
    setHoveredPoint(null);
    try {
      const res = await fetch(`/api/history/${encodeURIComponent(symbol)}?period=${selectedPeriod}&interval=${selectedInterval}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      if (!json.data || json.data.length === 0) {
        throw new Error('No historical candles returned');
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

      if (formattedCandles.length > 0) {
        const last = formattedCandles[formattedCandles.length - 1];
        const prev = formattedCandles.length > 1 ? formattedCandles[formattedCandles.length - 2] : last;
        const change = last.close - prev.close;
        const changePct = prev.close > 0 ? (change / prev.close) * 100 : 0;
        setLatestData({
          close: last.close,
          open: last.open,
          high: last.high,
          low: last.low,
          change,
          changePct,
        });
      }
    } catch (err) {
      console.error('Failed to load Nifty chart data:', err);
      setError('Unable to load graph. yfinance historical stream temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#12141a' },
          textColor: '#8b949e',
        },
        grid: {
          vertLines: { color: 'rgba(42, 45, 53, 0.5)' },
          horzLines: { color: 'rgba(42, 45, 53, 0.5)' },
        },
        crosshair: {
          mode: CrosshairMode.Magnet,
          vertLine: {
            color: 'rgba(0, 212, 170, 0.5)',
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: '#1a1d23',
          },
          horzLine: {
            color: 'rgba(0, 212, 170, 0.5)',
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
        height: 420,
      });

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
        });
      });

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      fetchChartData(period, interval, chartType);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      console.error('Error initializing Nifty chart:', err);
    }
  }, []);

  const handlePeriodChange = (p, inv) => {
    setPeriod(p);
    setInterval(inv);
    fetchChartData(p, inv, chartType);
  };

  const handleChartTypeChange = (newType) => {
    setChartType(newType);
    if (chartInstanceRef.current) {
      const series = createMainSeries(chartInstanceRef.current, newType);
      applyDataToSeries(series, newType);
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  const displayPrice = hoveredPoint ? hoveredPoint.price : latestData?.close;
  const displayChange = hoveredPoint ? hoveredPoint.change : latestData?.change;
  const displayChangePct = hoveredPoint ? hoveredPoint.changePct : latestData?.changePct;
  const isUp = (displayChangePct ?? 0) >= 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card, #1a1d23)',
        border: '1px solid var(--border, #2a2d35)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '960px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header with Groww-style dynamic hover display */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border, #2a2d35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a1d23, #161820)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(0, 212, 170, 0.15)',
                color: 'var(--accent, #00d4aa)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>NSE BENCHMARK</span>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{title}</h2>
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
            {displayPrice !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  ₹{Number(displayPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isUp ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)',
                  fontWeight: 700,
                  fontSize: '0.95rem'
                }}>
                  {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isUp ? '+' : ''}{Number(displayChange || 0).toFixed(2)} ({isUp ? '+' : ''}{Number(displayChangePct || 0).toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchChartData(period, interval, chartType)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border, #2a2d35)',
                color: 'var(--text-muted, #8b949e)',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Refresh Graph"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #8b949e)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Period Selector Tabs & Famous Graph Selector Dropdown */}
        <div style={{
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-bar, #12141a)',
          borderBottom: '1px solid var(--border, #2a2d35)',
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
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Famous Graphs Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          </div>
        </div>

        {/* Chart View with Groww Floating Info Overlay */}
        <div style={{ position: 'relative', width: '100%', height: '420px', background: '#12141a' }}>
          
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
                  ₹{Number(hoveredPoint.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: hoveredPoint.change >= 0 ? 'var(--green, #2ed573)' : 'var(--red, #ff4757)'
                }}>
                  {hoveredPoint.change >= 0 ? '▲ +' : '▼ '}{Number(hoveredPoint.change).toFixed(2)} ({Math.abs(hoveredPoint.changePct).toFixed(2)}%)
                </span>
                {hoveredPoint.volume > 0 && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #8b949e)' }}>
                    Vol: {Number(hoveredPoint.volume).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          )}

          {loading && (
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
                Fetching live exchange candles...
              </span>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              color: 'var(--red, #ff4757)',
              padding: '2rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '0.75rem 1.5rem',
          borderTop: '1px solid var(--border, #2a2d35)',
          background: 'var(--bg-card, #1a1d23)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted, #8b949e)'
        }}>
          <div>Exchange: National Stock Exchange (NSE India) • Realtime OHLCV</div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary, #22252d)',
              border: '1px solid var(--border, #2a2d35)',
              color: 'var(--text-main, #f0f2f5)',
              padding: '6px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
