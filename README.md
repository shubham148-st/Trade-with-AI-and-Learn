# NSE Trader View

A high-performance market monitoring, quantitative technical analysis, and paper trading platform for National Stock Exchange of India (NSE) equities. The application pairs a Python/Flask analytical backend with a responsive React 19 frontend utilizing TradingView Lightweight Charts, client-side SWR caching, and a realistic broker-grade execution simulation engine.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Client (Vite)                          │
│  ┌──────────────────┬─────────────────┬────────────────┬─────────────┐ │
│  │ Market Overview  │ Stock Analysis  │ Scanner/Intel  │ Paper Trade │ │
│  └──────────────────┴─────────────────┴────────────────┴─────────────┘ │
│       │ Lightweight Charts    │ SWR Query Cache   │ Page Visibility   │
└───────┼───────────────────────┼───────────────────┼───────────────────┘
        │                       │                   │
        ▼ REST APIs (Port 5500) ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Flask Backend (Python 3.13)                     │
│  ┌──────────────────────┬──────────────────────┬────────────────────┐  │
│  │   Analysis Engine    │  Paper Trading Core  │  Algo Knowledge    │  │
│  │  (pandas, indicators)│ (matching, charges)  │   (pattern catalog)│  │
│  └──────────────────────┴──────────────────────┴────────────────────┘  │
│         │ yfinance data stream          │ JSON State & In-memory Cache │
└─────────┼───────────────────────────────┼──────────────────────────────┘
          ▼                               ▼
    NSE Market Feeds              paper_state.json
```

The system is decoupled into two primary tiers:
1. **Backend Service (`nse-dashboard/`)**: Exposes REST endpoints for live quotes, historical candlestick data, multi-timeframe indicator calculations, pattern recognition, and virtual order matching.
2. **Frontend Single Page Application (`frontend/`)**: Built on React 19 with route-level code splitting (`React.lazy` + `Suspense`), intent-based chunk prefetching, and custom design tokens for institutional dark-mode telemetry.

---

## Core Features & Modules

### 1. Market Overview & Benchmark Telemetry (`/`)
- **Live Ticker Ribbon**: Scrolling marquee tracking real-time prices, net daily change, and percentage movement across top NSE equities.
- **Benchmark Index Cards**: Real-time status cards for **NIFTY 50** and **NIFTY BANK**, displaying day high/low ranges, percentage spread, intraday sparklines, and detailed modal views.
- **Sector Performance Heatmap**: Interactive performance breakdown across 9 industrial sectors (IT, Banking, Energy, Auto, Pharma, FMCG, Metals, Infrastructure, and Consumer Goods).
- **Market Movers Matrix**: Automated filtering for Top Gainers, Top Losers, and Volume Shockers.
- **Institutional Equity Screener**: High-density stock table featuring 52-week range progression bars, real-time search, multi-column sorting (Price, Change, Volume, Market Cap), and one-click comparative analysis.
- **Multi-Asset Performance Overlay**: Modal comparison tool allowing up to 4 equities to be plotted on a normalized percentage-change chart.

### 2. Deep Technical Analysis & Charting (`/stocks/:symbol`)
- **TradingView Lightweight Charts**: Multi-timeframe interactive charting engine supporting Candlestick, Area/Line, Baseline, and Bar visualizations.
- **Timeframe Resolutions**: 1 Day (1m/5m intervals), 5 Days, 1 Month, 6 Months, 1 Year, 5 Years, and Maximum available history.
- **Technical Indicator Overlays**:
  - Exponential Moving Averages: EMA 9, EMA 20, EMA 50, and EMA 200.
  - Bollinger Bands: 20-period moving average with 2.0 standard deviation envelopes.
  - Supertrend Indicator: Real-time ATR-based trend direction and trailing stops.
- **Oscillators & Momentum Sub-Charts**:
  - Relative Strength Index (RSI 14) with overbought (70) and oversold (30) boundary lines.
  - Moving Average Convergence Divergence (MACD 12, 26, 9) complete with signal line and histogram delta.
  - Average True Range (ATR 14) for volatility measurement.
- **Fundamental & Technical Telemetry**: P/E ratio, Market Cap, Beta, 52-week High/Low, Session VWAP, day turnover, and direct one-click trade prefill into the paper trading terminal.

### 3. Quantitative Scanner & Technical Intelligence (`/ai-analysis`)
- **Multi-Agent Evaluation Model**:
  - **News Intelligence**: Aggregated financial news feed with automated sentiment classification (Bullish, Bearish, Neutral).
  - **Historical Technical Structure**: Support/resistance level detection, swing high/low mapping, and multi-timeframe trend confluence scoring.
  - **Strategy Setup Generator**: Algorithmic identification of Intraday Scalp, Momentum Breakout, Mean Reversion, and Trend Continuation setups.
- **Actionable Execution Parameters**: Generated setups include exact Entry prices, Stop Loss limits, Target 1, Target 2, and calculated Risk-to-Reward (R:R) ratios.
- **Order Flow & Volume Profiling**: Imbalance metrics, estimated institutional delivery percentage, and volume expansion tracking.

### 4. Paper Trading Engine & Simulation Terminal (`/paper-trading`)
- **Realistic Brokerage Model**: Modeled after standard Indian discount brokers (Zerodha / Groww fee structure):
  - Brokerage: 0.03% or ₹20 flat cap per executed order.
  - Securities Transaction Tax (STT): 0.1% on delivery (CNC) buy/sell; 0.025% on intraday (MIS) sell.
  - Exchange turnover fees, SEBI turnover charges, Stamp Duty, and 18% GST on brokerage + transaction charges.
- **Order Execution Engine**:
  - Supported Order Types: `MARKET`, `LIMIT`, `SL` (Stop-Loss Limit), `SL-M` (Stop-Loss Market), and `GTT` (Good Till Triggered).
  - Supported Product Types: `CNC` (Cash & Carry for swing holdings) and `INTRADAY` (MIS with margin).
  - Bracket Orders: Define Stop Loss and Take Profit targets simultaneously with order submission.
  - Continuous tick-level matching engine that fills pending limit and stop-loss orders against live price feeds.
- **Autonomous Execution Agent**:
  - Configurable trade automation with customizable strategy sources (`PRE_MARKET`, `LIVE_ALGO`, `POST_MARKET`, `LEARNER_AGENT`, `CUSTOM`).
  - Strict capital guardrails: Maximum cash allocation limits, max allocation per trade percentage, max concurrent positions, minimum confidence thresholds, and symbol whitelisting.
- **Portfolio Analytics & Replay**:
  - Realized and unrealized P&L tracking, win rate, profit factor, average win/loss, and portfolio equity curve.
  - Time Machine simulation: Replay past trading dates to backtest execution logic against historical price action.
  - Persistent state saved to `paper_state.json` with manual reset capability.

### 5. Algo Academy & Pattern Lab (`/algo-academy`)
- **Quantitative Strategy Catalog**: Institutional documentation of quantitative trading patterns, including:
  - Institutional VWAP Pullback Alpha
  - Opening Range Breakout (ORB)
  - Liquidity Sweep & Order Block Reversal
  - EMA Ribbon Trend Ride (9/21/50)
  - Bollinger Band Mean Reversion Squeeze
  - Relative Volume (RVOL) Breakout
  - Multi-Timeframe Confluence Trend
  - Wyckoff Spring & Accumulation Breakout
- **Visual Pattern Canvas**: High-fidelity SVG setups comparing textbook theoretical patterns directly against real historical market candlestick executions.
- **Observational Learning Engine**: Live and historical pattern detection across tracked NSE equities, displaying historical sample counts, win-rate percentages, and average payoff ratios.

---

## Performance & Frontend Engineering

- **Route-Level Code Splitting**: All primary pages (`StockPage`, `AICommandCenter`, `PaperTrading`, `AlgoAcademy`) are loaded as independent dynamic chunks using `React.lazy` and `React.Suspense`, keeping the initial bundle size under 475 kB.
- **Intent-Based Prefetching**: Navigation links preload chunk assets on pointer hover (`onMouseEnter`), eliminating transition latency when changing views.
- **SWR Query Caching & Request Deduplication**: In-flight HTTP requests are deduplicated and cached with stale-while-revalidate policies, preventing duplicate network traffic during rapid tab switches.
- **Page Visibility Gating**: Real-time polling automatically pauses when the browser tab is minimized or out of focus via the Page Visibility API (`document.hidden`), resuming instantly upon refocus.
- **Error Boundary Fallbacks**: Isolated `RouteErrorBoundary` catches route-level chunk or network exceptions and displays a recovery interface without crashing the global application shell.
- **Mobile Ergonomics**: Input elements enforce a minimum 16px font size on viewports under 768px to prevent iOS auto-zoom, and all interactive targets adhere to a minimum 36px touch bounding box.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.13, Flask 3.0, Flask-CORS, Gunicorn, yfinance, pandas, numpy |
| **Frontend** | React 19, Vite 8, TradingView Lightweight Charts 5.2, Lucide React 1.66 |
| **Styling** | Semantic CSS Variables (Institutional Dark Theme), Flexbox/Grid, SVG graphics |
| **Tooling & Linter**| Oxlint, Node.js 24 |

---

## Project Structure

```
trader-view/
├── requirements.txt            # Python dependencies
├── Procfile                    # Production process definition (Gunicorn)
├── render.yaml                 # Cloud deployment specification
├── nse-dashboard/              # Backend service
│   ├── app.py                  # Flask REST API and route handlers
│   ├── analysis_engine.py      # Technical indicator and scanner calculation engine
│   ├── paper_trading.py        # Order matching engine and broker tax simulation
│   ├── algo_kb.py              # Quantitative pattern catalog and observation feed
│   ├── paper_state.json        # Persistent paper trading database state
│   ├── quotes_cache.json       # In-memory quote cache
│   └── real_candles_cache.json # Historical candlestick cache
└── frontend/                   # Frontend SPA
    ├── package.json            # Node.js dependencies and build scripts
    ├── vite.config.js          # Vite build configuration with proxy rules
    ├── index.html              # HTML entry point
    └── src/
        ├── main.jsx            # Application bootstrap
        ├── App.jsx             # Shell router, code splitting, visibility sync
        ├── index.css           # Global typography, color tokens, scrollbars
        ├── components/
        │   ├── Navbar.jsx              # Navigation header, search, market ticker
        │   ├── Footer.jsx              # Footer telemetry and status
        │   ├── MarketOverview.jsx      # Dashboard, sector heatmap, stock screener
        │   ├── StockPage.jsx           # TradingView candlestick charts & indicators
        │   ├── AICommandCenter.jsx     # Quantitative scanner and multi-agent setups
        │   ├── PaperTrading.jsx        # Virtual broker terminal and order book
        │   ├── AlgoAcademy.jsx         # Strategy pattern visualizer and learner feed
        │   ├── NiftyModal.jsx          # Benchmark index detailed modal view
        │   └── RouteErrorBoundary.jsx  # Route exception containment boundary
        ├── hooks/
        │   └── usePageVisibility.js    # Tab visibility gating hook
        └── utils/
            ├── preloadChunks.js        # Dynamic import prefetching utility
            └── queryCache.js           # Client-side SWR caching utility
```

---

## API Reference

The Flask backend serves REST endpoints on port `5500`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning backend status. |
| `GET` | `/api/stocks` | List of all 30 tracked NSE equities with sector mappings. |
| `GET` | `/api/sectors` | Sector definitions and assigned ticker symbols. |
| `GET` | `/api/quote/<symbol>` | Real-time quote, day range, volume, and previous close. |
| `GET` | `/api/batch_quotes?symbols=...` | Comma-delimited batch quote fetching for market screener. |
| `GET` | `/api/history/<symbol>?range=1mo&interval=1d` | Historical OHLCV candle arrays for charting. |
| `GET` | `/api/compare?symbols=...` | Normalized percentage-change data for comparative overlays. |
| `GET` | `/api/market_summary` | Aggregate market snapshot, advance/decline ratio, and top movers. |
| `GET` | `/api/analysis/scan` | Broad market quantitative scan across all tracked assets. |
| `GET` | `/api/analysis/news/<symbol>` | News feed and sentiment score for a specific ticker. |
| `GET` | `/api/analysis/historical/<symbol>` | Support/resistance levels and trend analysis. |
| `GET` | `/api/analysis/strategy/<symbol>` | Calculated strategy setups with target and stop-loss levels. |
| `GET` | `/api/analysis/full/<symbol>` | Consolidated analysis report combining news, history, and strategy. |
| `GET` | `/api/analysis/live/<symbol>` | Intraday momentum scoring and live technical indicators. |
| `GET` | `/api/algos` | Full directory of quantitative algorithm blueprints. |
| `GET` | `/api/algos/observed` | Real-time pattern detections recorded across NSE symbols. |
| `GET` | `/api/algos/<algo_id>` | Detailed specification and setup rules for a pattern. |
| `GET` | `/api/paper/summary` | Virtual account balance, positions, orders, and P&L metrics. |
| `POST`| `/api/paper/order` | Place a new virtual order (`symbol`, `qty`, `side`, `type`, `price`). |
| `POST`| `/api/paper/cancel_order` | Cancel an unexecuted pending order by `order_id`. |
| `GET` | `/api/paper/agent_config` | Fetch autonomous execution agent configuration and limits. |
| `POST`| `/api/paper/agent_config` | Update agent execution parameters and risk rules. |
| `POST`| `/api/paper/auto_execute` | Trigger agent evaluation cycle against active market signals. |
| `POST`| `/api/paper/simulate_date` | Step the virtual engine to a historical date for replay. |
| `POST`| `/api/paper/reset` | Reset virtual balance, positions, and history to defaults. |

---

## Getting Started

### Prerequisites
- **Python**: Version 3.11 or higher (3.13 recommended)
- **Node.js**: Version 20 or higher (v24 LTS recommended)
- **Package Managers**: `pip` and `npm`

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/trader-view.git
cd trader-view

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask backend server
python nse-dashboard/app.py
```
The backend service will start on `http://localhost:5500`.

### 2. Frontend Setup

In a separate terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend application will start on `http://localhost:5173` with automatic proxying of `/api/*` requests to the Flask server on port 5500.

### 3. Production Build

To verify and produce an optimized client production bundle:

```bash
cd frontend
npm run build
```
Compiled production assets will be output to `frontend/dist/`. To preview the production bundle locally:
```bash
npm run preview
```

To run the backend with Gunicorn in production environments:
```bash
gunicorn --chdir nse-dashboard app:app --bind 0.0.0.0:5500 --workers 2 --threads 4 --timeout 120
```

---

## Tracked Instruments

The default watchlist monitors major large-cap and mid-cap NSE equities across key economic sectors:

- **Information Technology**: TCS, INFY, WIPRO, HCLTECH, TECHM
- **Banking & Financials**: HDFCBANK, ICICIBANK, SBIN, KOTAKBANK, AXISBANK
- **Energy & Utilities**: RELIANCE, ONGC, NTPC, POWERGRID, BPCL
- **Automotive**: TATAMOTORS, MARUTI, M&M, BAJAJ-AUTO
- **Consumer & FMCG**: HINDUNILVR, ITC, NESTLEIND, BRITANNIA
- **Pharmaceuticals**: SUNPHARMA, DRREDDY, CIPLA
- **Metals & Mining**: TATASTEEL, JSWSTEEL, HINDALCO
- **Infrastructure & Conglomerates**: LT, ADANIENT
- **Market Indices**: NIFTY 50 (`^NSEI`), NIFTY BANK (`^NSEBANK`)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
