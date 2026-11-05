"""
NSE Stock Market Dashboard - Flask Backend
Serves real-time and historical NSE data from Yahoo Finance.
"""

import json
import os
import time
import threading
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import pandas as pd

app = Flask(__name__)
CORS(app)

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quotes_cache.json")
_QUOTES_CACHE = {
    "timestamp": 0,
    "data": []
}
_HISTORY_CACHE = {}  # key: (symbol, period, interval) -> { "timestamp": float, "payload": dict }

class CircuitBreaker:
    """Thread-safe circuit breaker preventing cascading failures to yfinance."""
    def __init__(self, failure_threshold=5, recovery_timeout=30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = "CLOSED"
        self._lock = threading.Lock()

    def can_execute(self):
        with self._lock:
            if self.state == "OPEN":
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = "HALF_OPEN"
                    return True
                return False
            return True

    def record_success(self):
        with self._lock:
            self.failure_count = 0
            self.state = "CLOSED"

    def record_failure(self):
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"

_YF_CIRCUIT = CircuitBreaker(failure_threshold=5, recovery_timeout=25.0)


if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, "r") as f:
            saved = json.load(f)
            if isinstance(saved, list) and len(saved) > 0:
                _QUOTES_CACHE["data"] = saved
                _QUOTES_CACHE["timestamp"] = time.time()
    except Exception:
        pass

# ── Popular NSE Stocks (Yahoo uses .NS suffix) ──────────────────────────────
NSE_STOCKS = {
    # Indices
    "^NSEI": "NIFTY 50",
    "^NSEBANK": "NIFTY BANK",
    # Large-cap stocks
    "RELIANCE.NS": "Reliance Industries",
    "TCS.NS": "Tata Consultancy Services",
    "HDFCBANK.NS": "HDFC Bank",
    "INFY.NS": "Infosys",
    "ICICIBANK.NS": "ICICI Bank",
    "HINDUNILVR.NS": "Hindustan Unilever",
    "ITC.NS": "ITC",
    "SBIN.NS": "State Bank of India",
    "BHARTIARTL.NS": "Bharti Airtel",
    "KOTAKBANK.NS": "Kotak Mahindra Bank",
    "LT.NS": "Larsen & Toubro",
    "AXISBANK.NS": "Axis Bank",
    "ASIANPAINT.NS": "Asian Paints",
    "MARUTI.NS": "Maruti Suzuki",
    "TITAN.NS": "Titan Company",
    "SUNPHARMA.NS": "Sun Pharma",
    "ULTRACEMCO.NS": "UltraTech Cement",
    "WIPRO.NS": "Wipro",
    "BAJFINANCE.NS": "Bajaj Finance",
    "HCLTECH.NS": "HCL Technologies",
    "M&M.NS": "Mahindra & Mahindra",
    "ADANIENT.NS": "Adani Enterprises",
    "TATASTEEL.NS": "Tata Steel",
    "POWERGRID.NS": "Power Grid Corp",
    "NTPC.NS": "NTPC",
    "ONGC.NS": "ONGC",
    "COALINDIA.NS": "Coal India",
    "JSWSTEEL.NS": "JSW Steel",
    "TECHM.NS": "Tech Mahindra",
}

SECTOR_MAP = {
    "IT": ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS"],
    "Banking": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS"],
    "Energy": ["RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS", "COALINDIA.NS"],
    "Auto": ["MARUTI.NS", "M&M.NS"],
    "FMCG": ["HINDUNILVR.NS", "ITC.NS"],
    "Pharma": ["SUNPHARMA.NS"],
    "Metals": ["TATASTEEL.NS", "JSWSTEEL.NS"],
    "Infra": ["LT.NS", "ULTRACEMCO.NS", "ADANIENT.NS"],
    "Consumer": ["ASIANPAINT.NS", "TITAN.NS", "BAJFINANCE.NS"],
}


def _safe_float(val):
    """Convert to float, handling NaN and None."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    return round(float(val), 2)


# ── Routes ──────────────────────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_client(path):
    # Don't intercept API routes
    if path.startswith("api"):
        return jsonify({"error": "Endpoint not found"}), 404

    # Serve static assets from frontend/dist if they exist
    if path and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)

    # SPA index fallback for client-side routing (/stocks/*, /AI/*, /paper-trading, etc.)
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")

    return render_template("index.html")


@app.route("/api/stocks")
def get_stock_list():
    """Return the list of tracked NSE stocks."""
    return jsonify(
        [{"symbol": sym, "name": name} for sym, name in NSE_STOCKS.items()]
    )


@app.route("/api/sectors")
def get_sectors():
    """Return sector-wise groupings."""
    return jsonify(SECTOR_MAP)


@app.route("/api/health")
def api_health():
    """Health check endpoint to probe backend status, cache state, and uptime."""
    return jsonify({
        "status": "ok",
        "service": "nse-quant-backend",
        "port": int(os.environ.get("PORT", 5500)),
        "circuit_breaker": _YF_CIRCUIT.state,
        "cached_symbols_count": len(_QUOTES_CACHE.get("data", [])),
        "cache_age_seconds": round(time.time() - _QUOTES_CACHE["timestamp"], 1) if _QUOTES_CACHE.get("timestamp") else None,
        "timestamp": time.time()
    })



@app.route("/api/quote/<symbol>")
def get_quote(symbol):
    """Get real-time quote for a single stock."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist_1d = ticker.history(period="1d", interval="1m")

        # Build intraday sparkline data
        sparkline = []
        if not hist_1d.empty:
            for ts, row in hist_1d.iterrows():
                sparkline.append({
                    "time": ts.strftime("%H:%M"),
                    "price": _safe_float(row["Close"]),
                })

        return jsonify({
            "symbol": symbol,
            "name": NSE_STOCKS.get(symbol, info.get("shortName", symbol)),
            "price": _safe_float(info.get("currentPrice") or info.get("regularMarketPrice")),
            "previousClose": _safe_float(info.get("previousClose") or info.get("regularMarketPreviousClose")),
            "open": _safe_float(info.get("open") or info.get("regularMarketOpen")),
            "dayHigh": _safe_float(info.get("dayHigh") or info.get("regularMarketDayHigh")),
            "dayLow": _safe_float(info.get("dayLow") or info.get("regularMarketDayLow")),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "marketCap": info.get("marketCap"),
            "fiftyTwoWeekHigh": _safe_float(info.get("fiftyTwoWeekHigh")),
            "fiftyTwoWeekLow": _safe_float(info.get("fiftyTwoWeekLow")),
            "pe": _safe_float(info.get("trailingPE")),
            "sparkline": sparkline,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/batch_quotes")
def batch_quotes():
    """Get quick quotes for all tracked stocks with circuit breaker, timeout protection and cache fallback."""
    force = request.args.get("force", "0") == "1"
    now = time.time()

    # 1. Immediate cache return if fresh
    if not force and _QUOTES_CACHE["data"] and (now - _QUOTES_CACHE["timestamp"] < 60):
        return jsonify(_QUOTES_CACHE["data"])

    # 2. Circuit breaker check: if upstream is open, immediately return cached data
    if not _YF_CIRCUIT.can_execute():
        if _QUOTES_CACHE["data"]:
            return jsonify(_QUOTES_CACHE["data"])

    symbols = list(NSE_STOCKS.keys())
    existing_map = {item["symbol"]: item for item in _QUOTES_CACHE.get("data", []) if isinstance(item, dict) and "symbol" in item}

    def fetch_single(sym):
        try:
            t = yf.Ticker(sym)
            fi = t.fast_info
            price = _safe_float(getattr(fi, "last_price", None))
            prev = _safe_float(getattr(fi, "previous_close", None))
            change = round(price - prev, 2) if price and prev else None
            change_pct = round((change / prev) * 100, 2) if change and prev else None
            return {
                "symbol": sym,
                "name": NSE_STOCKS.get(sym, sym),
                "price": price,
                "change": change,
                "changePct": change_pct,
            }
        except Exception:
            prev_cached = existing_map.get(sym)
            if prev_cached and prev_cached.get("price") is not None:
                return prev_cached
            return {
                "symbol": sym,
                "name": NSE_STOCKS.get(sym, sym),
                "price": None,
                "change": None,
                "changePct": None,
            }

    try:
        results = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_sym = {executor.submit(fetch_single, sym): sym for sym in symbols}
            done, not_done = wait(future_to_sym.keys(), timeout=10.0)

            for future in done:
                try:
                    results.append(future.result())
                except Exception:
                    sym = future_to_sym[future]
                    results.append(existing_map.get(sym, {"symbol": sym, "name": NSE_STOCKS.get(sym, sym), "price": None, "change": None, "changePct": None}))

            for future in not_done:
                sym = future_to_sym[future]
                future.cancel()
                results.append(existing_map.get(sym, {"symbol": sym, "name": NSE_STOCKS.get(sym, sym), "price": None, "change": None, "changePct": None}))

        has_prices = any(r.get("price") is not None for r in results)
        if has_prices:
            _YF_CIRCUIT.record_success()
            _QUOTES_CACHE["data"] = results
            _QUOTES_CACHE["timestamp"] = now
            try:
                with open(CACHE_FILE, "w") as f:
                    json.dump(results, f)
            except Exception:
                pass
            return jsonify(results)
        else:
            _YF_CIRCUIT.record_failure()
            if _QUOTES_CACHE["data"]:
                return jsonify(_QUOTES_CACHE["data"])
            return jsonify(results)
    except Exception as e:
        _YF_CIRCUIT.record_failure()
        if _QUOTES_CACHE["data"]:
            return jsonify(_QUOTES_CACHE["data"])
        return jsonify({"error": str(e)}), 500


@app.route("/api/history/<symbol>")
def get_history(symbol):
    """
    Get historical OHLCV data with 5-minute cache to protect against Yahoo Finance rate limits.
    Query params:
      period  - 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max  (default: 6mo)
      interval - 1m,5m,15m,30m,1h,1d,1wk,1mo             (default: 1d)
    """
    period = request.args.get("period", "6mo")
    interval = request.args.get("interval", "1d")
    cache_key = (symbol, period, interval)
    now = time.time()

    # For live intraday (1d), cache for 20s so new ticks stream live. For historical, cache for 300s.
    ttl = 20 if period == "1d" else 300
    if cache_key in _HISTORY_CACHE and (now - _HISTORY_CACHE[cache_key]["timestamp"] < ttl):
        return jsonify(_HISTORY_CACHE[cache_key]["payload"])

    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)

        if hist.empty:
            return jsonify({"error": "No data available"}), 404

        data = []
        for ts, row in hist.iterrows():
            close_raw = row["Close"]
            open_raw = row["Open"]
            if pd.isna(close_raw) or pd.isna(open_raw) or close_raw is None:
                continue
            close_val = _safe_float(close_raw)
            open_val = _safe_float(open_raw)
            if close_val is None or close_val <= 0:
                continue

            data.append({
                "time": int(ts.timestamp()) if interval in ("1m", "5m", "15m", "30m", "1h") else ts.strftime("%Y-%m-%d"),
                "date": ts.strftime("%Y-%m-%d %H:%M") if interval in ("1m", "5m", "15m", "30m", "1h") else ts.strftime("%Y-%m-%d"),
                "timestamp": int(ts.timestamp()),
                "open": open_val or close_val,
                "high": _safe_float(row["High"]) or close_val,
                "low": _safe_float(row["Low"]) or close_val,
                "close": close_val,
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
            })

        payload = {
            "symbol": symbol,
            "name": NSE_STOCKS.get(symbol, symbol),
            "period": period,
            "interval": interval,
            "data": data,
        }
        _HISTORY_CACHE[cache_key] = {"timestamp": now, "payload": payload}
        return jsonify(payload)
    except Exception as e:
        if cache_key in _HISTORY_CACHE:
            return jsonify(_HISTORY_CACHE[cache_key]["payload"])
        return jsonify({"error": str(e)}), 500
        return jsonify({"error": str(e)}), 500


@app.route("/api/compare")
def compare_stocks():
    """Compare multiple stocks over a period. ?symbols=TCS.NS,INFY.NS&period=1y"""
    symbols_str = request.args.get("symbols", "")
    period = request.args.get("period", "1y")
    symbols = [s.strip() for s in symbols_str.split(",") if s.strip()]

    if not symbols:
        return jsonify({"error": "No symbols provided"}), 400

    result = {}
    for sym in symbols:
        try:
            hist = yf.Ticker(sym).history(period=period)
            if not hist.empty:
                # Normalize to percentage change from first close
                first_close = hist["Close"].iloc[0]
                result[sym] = {
                    "name": NSE_STOCKS.get(sym, sym),
                    "data": [
                        {
                            "date": ts.strftime("%Y-%m-%d"),
                            "pctChange": round(((row["Close"] - first_close) / first_close) * 100, 2),
                        }
                        for ts, row in hist.iterrows()
                    ],
                }
        except Exception:
            continue

    return jsonify(result)


@app.route("/api/market_summary")
def market_summary():
    """Quick market summary: indices + top gainers/losers."""
    try:
        # Fetch all quotes
        symbols = [s for s in NSE_STOCKS.keys() if not s.startswith("^")]
        tickers = yf.Tickers(" ".join(symbols))
        stocks = []
        for sym in symbols:
            try:
                fi = tickers.tickers[sym].fast_info
                price = _safe_float(getattr(fi, "last_price", None))
                prev = _safe_float(getattr(fi, "previous_close", None))
                if price and prev:
                    change_pct = round(((price - prev) / prev) * 100, 2)
                    stocks.append({
                        "symbol": sym,
                        "name": NSE_STOCKS[sym],
                        "price": price,
                        "changePct": change_pct,
                    })
            except Exception:
                continue

        stocks.sort(key=lambda x: x["changePct"], reverse=True)
        gainers = stocks[:5]
        losers = stocks[-5:][::-1]

        return jsonify({"gainers": gainers, "losers": losers})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ══════════════════════════════════════════════════════════════
# ANALYSIS SYSTEM ROUTES
# ══════════════════════════════════════════════════════════════

from analysis_engine import (
    news_agent, historical_agent, strategy_agent,
    score_stock, scan_all, full_analysis, live_monitor,
)


@app.route("/analysis")
def analysis_page():
    return render_template("analysis.html")


@app.route("/api/analysis/scan")
def analysis_scan():
    """Run all 3 agents on all stocks — returns ranked results."""
    try:
        results = scan_all(NSE_STOCKS)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analysis/news/<symbol>")
def analysis_news(symbol):
    try:
        return jsonify(news_agent(symbol))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analysis/historical/<symbol>")
def analysis_hist(symbol):
    try:
        return jsonify(historical_agent(symbol))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analysis/strategy/<symbol>")
def analysis_strat(symbol):
    try:
        return jsonify(strategy_agent(symbol))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analysis/full/<symbol>")
def analysis_full(symbol):
    """Full analysis with chart data + all agent outputs."""
    try:
        return jsonify(full_analysis(symbol, NSE_STOCKS))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analysis/live/<symbol>")
def analysis_live(symbol):
    """Live monitoring data for market hours."""
    try:
        return jsonify(live_monitor(symbol))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


from algo_kb import ALGO_DIRECTORY
from paper_trading import (
    get_paper_summary, execute_order, auto_paper_trade_signals, reset_paper_account
)


@app.route("/api/algos")
def get_algos():
    """Returns directory of algorithmic strategies with rules and beginner explanations."""
    return jsonify(list(ALGO_DIRECTORY.values()))


@app.route("/api/algos/<algo_id>")
def get_algo_detail(algo_id):
    algo = ALGO_DIRECTORY.get(algo_id)
    if not algo:
        return jsonify({"error": "Algo not found"}), 404
    return jsonify(algo)


@app.route("/api/paper/summary")
def paper_summary():
    """Returns current paper trading portfolio, balances, active positions, stats."""
    # Build quick map of latest prices for open positions
    state_summary = get_paper_summary()
    open_syms = list(state_summary["positions"].keys())
    prices = {}
    if open_syms:
        try:
            tickers = yf.Tickers(" ".join(open_syms))
            for sym in open_syms:
                try:
                    price = _safe_float(getattr(tickers.tickers[sym].fast_info, "last_price", None))
                    if price:
                        prices[sym] = price
                except Exception:
                    pass
        except Exception:
            pass
    return jsonify(get_paper_summary(prices))


@app.route("/api/paper/order", methods=["POST"])
def paper_order():
    """Places a manual or algorithmic paper order."""
    data = request.json or {}
    symbol = data.get("symbol")
    side = data.get("side", "BUY").upper()
    qty = data.get("qty")
    price = data.get("price")
    stop_loss = data.get("stop_loss")
    target = data.get("target")
    algo_name = data.get("algo_name", "Manual")

    if not symbol or not qty or not price:
        return jsonify({"error": "Missing symbol, qty or price"}), 400

    res = execute_order(symbol, side, qty, price, stop_loss, target, algo_name)
    return jsonify(res)


@app.route("/api/paper/auto_execute", methods=["POST"])
def paper_auto_execute():
    """Runs automated algo executor based on latest screened signals."""
    data = request.json or {}
    signals = data.get("signals", [])
    
    # fetch current prices
    symbols = list(set([s.get("symbol") for s in signals if s.get("symbol")]))
    prices = {}
    if symbols:
        try:
            tickers = yf.Tickers(" ".join(symbols))
            for sym in symbols:
                try:
                    price = _safe_float(getattr(tickers.tickers[sym].fast_info, "last_price", None))
                    if price:
                        prices[sym] = price
                except Exception:
                    pass
        except Exception:
            pass

    executed = auto_paper_trade_signals(signals, prices)
    summary = get_paper_summary(prices)
    return jsonify({"executed": executed, "summary": summary})


@app.route("/api/paper/reset", methods=["POST"])
def paper_reset():
    return jsonify(reset_paper_account())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5500))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug, threaded=True)

