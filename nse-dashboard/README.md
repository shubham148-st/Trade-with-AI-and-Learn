# NSE Stock Market Dashboard

A real-time analytical dashboard for NSE (National Stock Exchange) stocks powered by Yahoo Finance data.

## Features

- **Live Ticker Ribbon** — scrolling marquee with all tracked NSE stock prices
- **Market Overview** — NIFTY 50 & NIFTY BANK index cards, full stock table with sparklines
- **Interactive Charts** — TradingView-style candlestick charts with volume overlay (5D / 1M / 6M / 1Y / 2Y / 5Y / MAX)
- **Stock Comparison** — normalized percentage-change overlay for comparing multiple stocks
- **Sector Heatmap** — visual sector performance with pie & bar breakdowns
- **Top Gainers & Losers** — daily movers at a glance
- **Search** — instant stock lookup
- **Auto-refresh** — data refreshes every 60 seconds

## Quick Start

```bash
cd nse-dashboard
pip install -r requirements.txt
python app.py
```

Open **http://localhost:5500** in your browser.

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Backend  | Python 3.13 + Flask + yfinance + pandas |
| Charts   | TradingView Lightweight Charts          |
| Analytics| Chart.js                                |
| UI       | Bootstrap 5 (dark theme)                |

## Tracked Stocks

30 major NSE stocks across IT, Banking, Energy, FMCG, Pharma, Metals, Auto, Infra, and Consumer sectors — plus NIFTY 50 and NIFTY BANK indices.

