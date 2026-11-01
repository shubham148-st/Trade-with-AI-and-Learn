"""
NSE Trading Analysis Engine
Multi-agent analysis system: News Intelligence, Historical Analysis, Strategy Analysis.
"""

import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime
import re


# ══════════════════════════════════════════════════════════════
# TECHNICAL INDICATORS
# ══════════════════════════════════════════════════════════════

def calc_ema(series, period):
    return series.ewm(span=period, adjust=False).mean()

def calc_sma(series, period):
    return series.rolling(window=period).mean()

def calc_rsi(prices, period=14):
    delta = prices.diff()
    gain = delta.where(delta > 0, 0).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calc_macd(prices, fast=12, slow=26, signal=9):
    ema_fast = calc_ema(prices, fast)
    ema_slow = calc_ema(prices, slow)
    macd_line = ema_fast - ema_slow
    signal_line = calc_ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

def calc_atr(high, low, close, period=14):
    tr = pd.concat([
        high - low,
        (high - close.shift()).abs(),
        (low - close.shift()).abs(),
    ], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()

def calc_vwap(high, low, close, volume):
    typical = (high + low + close) / 3
    cum_vol = volume.cumsum()
    cum_tp = (typical * volume).cumsum()
    return cum_tp / cum_vol

def calc_bollinger(prices, period=20, std_dev=2):
    mid = calc_sma(prices, period)
    std = prices.rolling(window=period).std()
    return mid + std * std_dev, mid, mid - std * std_dev

def find_support_resistance(high, low, close, lookback=60):
    rh = high.tail(lookback)
    rl = low.tail(lookback)
    rc = close.tail(lookback)
    pivot = (rh.iloc[-1] + rl.iloc[-1] + rc.iloc[-1]) / 3
    r1 = 2 * pivot - rl.iloc[-1]
    r2 = pivot + (rh.iloc[-1] - rl.iloc[-1])
    s1 = 2 * pivot - rh.iloc[-1]
    s2 = pivot - (rh.iloc[-1] - rl.iloc[-1])

    swing_hi, swing_lo = [], []
    for i in range(5, len(rh) - 5):
        if rh.iloc[i] == rh.iloc[max(0,i-5):i+6].max():
            swing_hi.append(float(rh.iloc[i]))
        if rl.iloc[i] == rl.iloc[max(0,i-5):i+6].min():
            swing_lo.append(float(rl.iloc[i]))

    resistances = sorted(set([float(r1), float(r2)] + swing_hi[-3:]), reverse=True)[:3]
    supports = sorted(set([float(s1), float(s2)] + swing_lo[-3:]))[:3]
    return {
        "pivot": round(float(pivot), 2),
        "resistances": [round(r, 2) for r in resistances],
        "supports": [round(s, 2) for s in supports],
    }


# ══════════════════════════════════════════════════════════════
# SENTIMENT ANALYSIS
# ══════════════════════════════════════════════════════════════

_POS = {
    'surge','jump','rally','gain','profit','growth','beat','upgrade',
    'bullish','breakout','record','high','strong','outperform','buy',
    'positive','optimistic','recovery','boost','rises','soar','expand',
    'dividend','bonus','acquisition','partnership','launch','approve',
    'exceed','momentum','robust','milestone','opportunity',
}
_NEG = {
    'fall','drop','crash','loss','decline','downgrade','bearish','weak',
    'risk','sell','negative','concern','fear','cut','down','slump',
    'plunge','miss','below','warning','debt','investigation','lawsuit',
    'fraud','fine','penalty','delay','cancel','layoff','restructure',
    'default','bankruptcy','violation','probe','crisis',
}

def _sentiment_score(text):
    words = set(re.findall(r'\w+', text.lower()))
    p, n = len(words & _POS), len(words & _NEG)
    t = p + n
    return min(100, max(0, int((p / t) * 100))) if t else 50


# ══════════════════════════════════════════════════════════════
# AGENT 1 — NEWS INTELLIGENCE
# ══════════════════════════════════════════════════════════════

def news_agent(symbol):
    try:
        ticker = yf.Ticker(symbol)
        news = ticker.news or []
        if not news:
            return {"score": 50, "sentiment": "neutral", "news_count": 0,
                    "articles": [], "risk_flags": [], "summary": "No recent news."}

        articles, scores, risk_flags = [], [], []
        for item in news[:10]:
            title = item.get("title", "")
            sc = _sentiment_score(title)
            scores.append(sc)
            label = "positive" if sc > 60 else ("negative" if sc < 40 else "neutral")
            if any(w in title.lower() for w in ('fraud','investigation','lawsuit','crash','crisis','default')):
                risk_flags.append(title)
            articles.append({
                "title": title,
                "publisher": item.get("publisher", ""),
                "link": item.get("link", ""),
                "sentiment": label,
                "score": sc,
            })

        avg = int(sum(scores) / len(scores))
        overall = "positive" if avg > 60 else ("negative" if avg < 40 else "neutral")
        return {
            "score": avg, "sentiment": overall, "news_count": len(articles),
            "articles": articles, "risk_flags": risk_flags,
            "summary": f"{overall.title()} sentiment — {len(articles)} articles",
        }
    except Exception as e:
        return {"score": 50, "sentiment": "neutral", "news_count": 0,
                "articles": [], "risk_flags": [], "summary": str(e)}


# ══════════════════════════════════════════════════════════════
# AGENT 2 — HISTORICAL ANALYSIS
# ══════════════════════════════════════════════════════════════

def historical_agent(symbol):
    try:
        hist = yf.Ticker(symbol).history(period="6mo")
        if hist.empty or len(hist) < 30:
            return {"score": 50, "trend": "unknown", "summary": "Insufficient data"}

        c, h, l, v = hist["Close"], hist["High"], hist["Low"], hist["Volume"]
        cur = float(c.iloc[-1])
        e9 = float(calc_ema(c, 9).iloc[-1])
        e21 = float(calc_ema(c, 21).iloc[-1])
        e50 = float(calc_ema(c, 50).iloc[-1]) if len(c) >= 50 else None

        # Trend
        if cur > e9 > e21:
            trend, tscore = "strong_uptrend", 90
        elif cur > e21:
            trend, tscore = "uptrend", 75
        elif cur < e9 < e21:
            trend, tscore = "strong_downtrend", 15
        elif cur < e21:
            trend, tscore = "downtrend", 30
        else:
            trend, tscore = "sideways", 50

        # Volume
        avg20 = float(v.tail(20).mean())
        rec5 = float(v.tail(5).mean())
        vratio = rec5 / avg20 if avg20 > 0 else 1
        vscore = min(100, int(50 + (vratio - 1) * 30))

        # ATR
        atr_v = float(calc_atr(h, l, c).iloc[-1])
        atr_pct = (atr_v / cur) * 100

        sr = find_support_resistance(h, l, c)
        w52h, w52l = float(h.max()), float(l.min())
        pos = ((cur - w52l) / (w52h - w52l)) * 100 if w52h != w52l else 50

        score = int(tscore * 0.5 + vscore * 0.2 + (100 - min(atr_pct * 10, 100)) * 0.15 + pos * 0.15)
        return {
            "score": max(0, min(100, score)), "trend": trend, "trend_score": tscore,
            "ema9": round(e9, 2), "ema21": round(e21, 2),
            "ema50": round(e50, 2) if e50 else None,
            "volume_ratio": round(vratio, 2), "volume_score": vscore,
            "atr": round(atr_v, 2), "atr_pct": round(atr_pct, 2),
            "support_resistance": sr,
            "week52_high": round(w52h, 2), "week52_low": round(w52l, 2),
            "price_position": round(pos, 1),
            "summary": f"{trend.replace('_',' ').title()} — Vol {vratio:.1f}x — ATR {atr_pct:.1f}%",
        }
    except Exception as e:
        return {"score": 50, "trend": "unknown", "summary": str(e)}


# ══════════════════════════════════════════════════════════════
# AGENT 3 — STRATEGY ANALYSIS
# ══════════════════════════════════════════════════════════════

def strategy_agent(symbol):
    try:
        hist = yf.Ticker(symbol).history(period="3mo")
        if hist.empty or len(hist) < 30:
            return {"score": 50, "signal": "hold", "confidence": 0,
                    "summary": "Insufficient data"}

        c, h, l, v = hist["Close"], hist["High"], hist["Low"], hist["Volume"]
        cur = float(c.iloc[-1])

        # RSI
        rsi_v = float(calc_rsi(c).iloc[-1])

        # MACD
        ml, ms, mh = calc_macd(c)
        macd_v, sig_v, hist_v = float(ml.iloc[-1]), float(ms.iloc[-1]), float(mh.iloc[-1])
        crossover = macd_v > sig_v and float(ml.iloc[-2]) <= float(ms.iloc[-2])
        crossunder = macd_v < sig_v and float(ml.iloc[-2]) >= float(ms.iloc[-2])

        # Bollinger
        bbu, _, bbl = calc_bollinger(c)
        bb_pos = (cur - float(bbl.iloc[-1])) / (float(bbu.iloc[-1]) - float(bbl.iloc[-1])) \
            if (float(bbu.iloc[-1]) - float(bbl.iloc[-1])) > 0 else 0.5

        # Breakout
        res20 = float(h.tail(20).max())
        vol_avg = float(v.tail(20).mean())
        vol_today = float(v.iloc[-1])
        near_bo = cur >= res20 * 0.98
        vol_bo = vol_today > vol_avg * 1.5
        is_bo = near_bo and vol_bo

        # Momentum
        r5 = ((cur / float(c.iloc[-6])) - 1) * 100 if len(c) > 5 else 0
        r10 = ((cur / float(c.iloc[-11])) - 1) * 100 if len(c) > 10 else 0
        r20 = ((cur / float(c.iloc[-21])) - 1) * 100 if len(c) > 20 else 0

        # Levels
        atr_v = float(calc_atr(h, l, c).iloc[-1])
        entry = [round(cur * 0.995, 2), round(cur * 1.005, 2)]
        sl = round(cur - atr_v * 2, 2)
        t1 = round(cur + atr_v * 2, 2)
        t2 = round(cur + atr_v * 3.5, 2)
        t3 = round(cur + atr_v * 5, 2)
        rr = round((t1 - cur) / (cur - sl), 2) if (cur - sl) > 0 else 0

        # Scoring
        buy, sell = 0, 0
        if rsi_v < 30: buy += 2
        elif rsi_v < 40: buy += 1
        elif rsi_v > 70: sell += 2
        elif rsi_v > 60: sell += 1
        if crossover: buy += 2
        if crossunder: sell += 2
        if hist_v > 0: buy += 1
        else: sell += 1
        if is_bo: buy += 3
        if bb_pos < 0.2: buy += 1
        if bb_pos > 0.8: sell += 1
        if r5 > 3: buy += 1
        elif r5 < -3: sell += 1

        total = buy + sell
        if total == 0:
            signal, conf = "hold", 50
        elif buy > sell:
            signal, conf = "buy", min(95, int((buy / total) * 100))
        else:
            signal, conf = "sell", min(95, int((sell / total) * 100))

        score = conf if signal == "buy" else (100 - conf if signal == "sell" else 50)

        reasons = []
        if is_bo: reasons.append("Breakout with volume")
        if crossover: reasons.append("MACD bullish crossover")
        if crossunder: reasons.append("MACD bearish crossover")
        if rsi_v < 30: reasons.append(f"RSI oversold ({rsi_v:.0f})")
        if rsi_v > 70: reasons.append(f"RSI overbought ({rsi_v:.0f})")
        if r5 > 5: reasons.append(f"Strong momentum (+{r5:.1f}%)")
        if r5 < -5: reasons.append(f"Weak momentum ({r5:.1f}%)")
        if not reasons: reasons.append("No strong signals")

        return {
            "score": max(0, min(100, score)), "signal": signal, "confidence": conf,
            "rsi": round(rsi_v, 1),
            "macd": round(macd_v, 2), "macd_signal": round(sig_v, 2),
            "macd_histogram": round(hist_v, 2), "macd_crossover": crossover,
            "bb_position": round(bb_pos, 2), "is_breakout": is_bo,
            "momentum_5d": round(r5, 2), "momentum_10d": round(r10, 2),
            "momentum_20d": round(r20, 2),
            "entry_zone": entry, "stop_loss": sl,
            "targets": [t1, t2, t3], "risk_reward": rr,
            "reasons": reasons,
            "summary": f"{signal.upper()} — {conf}% conf — R:R {rr}:1",
        }
    except Exception as e:
        return {"score": 50, "signal": "hold", "confidence": 0, "summary": str(e)}


# ══════════════════════════════════════════════════════════════
# CENTRAL SCORING ENGINE
# ══════════════════════════════════════════════════════════════

def score_stock(news_r, hist_r, strat_r):
    ns = news_r.get("score", 50)
    hs = hist_r.get("score", 50)
    ss = strat_r.get("score", 50)
    overall = int(ns * 0.25 + hs * 0.35 + ss * 0.40)
    if news_r.get("risk_flags"):
        overall = max(0, overall - 10)
    if strat_r.get("is_breakout"):
        overall = min(100, overall + 5)
    return {"overall": max(0, min(100, overall)),
            "news": ns, "history": hs, "strategy": ss}


# ══════════════════════════════════════════════════════════════
# SCAN ALL STOCKS
# ══════════════════════════════════════════════════════════════

def scan_all(stock_dict):
    results = []
    symbols = [s for s in stock_dict if not s.startswith("^")]
    for sym in symbols:
        try:
            n = news_agent(sym)
            h = historical_agent(sym)
            s = strategy_agent(sym)
            sc = score_stock(n, h, s)
            results.append({
                "symbol": sym, "name": stock_dict[sym],
                "overall": sc["overall"], "news_score": sc["news"],
                "hist_score": sc["history"], "strat_score": sc["strategy"],
                "signal": s.get("signal", "hold"),
                "confidence": s.get("confidence", 0),
                "trend": h.get("trend", "unknown"),
                "risk_flags": len(n.get("risk_flags", [])),
                "momentum_5d": s.get("momentum_5d", 0),
                "rsi": s.get("rsi", 50),
            })
        except Exception:
            results.append({
                "symbol": sym, "name": stock_dict[sym],
                "overall": 0, "news_score": 0, "hist_score": 0,
                "strat_score": 0, "signal": "error", "confidence": 0,
                "trend": "unknown", "risk_flags": 0,
                "momentum_5d": 0, "rsi": 50,
            })
    results.sort(key=lambda x: x["overall"], reverse=True)
    return results


# ══════════════════════════════════════════════════════════════
# FULL STOCK ANALYSIS (detail chart data + agents)
# ══════════════════════════════════════════════════════════════

def _sf(v):
    return None if v is None or (isinstance(v, float) and pd.isna(v)) else round(float(v), 2)

def full_analysis(symbol, stock_dict):
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="6mo")
    if hist.empty:
        return {"error": "No data"}

    c, h_s, l_s, vol = hist["Close"], hist["High"], hist["Low"], hist["Volume"]
    e9 = calc_ema(c, 9)
    e21 = calc_ema(c, 21)
    e50 = calc_ema(c, 50) if len(c) >= 50 else pd.Series(dtype=float)
    vw = calc_vwap(h_s, l_s, c, vol)
    rs = calc_rsi(c)
    ml, ms_l, mh_s = calc_macd(c)
    bbu, _, bbl = calc_bollinger(c)

    chart = []
    for i, (ts, row) in enumerate(hist.iterrows()):
        pt = {
            "date": ts.strftime("%Y-%m-%d"),
            "open": _sf(row["Open"]), "high": _sf(row["High"]),
            "low": _sf(row["Low"]), "close": _sf(row["Close"]),
            "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
        }
        if i < len(e9): pt["ema9"] = _sf(e9.iloc[i])
        if i < len(e21): pt["ema21"] = _sf(e21.iloc[i])
        if len(e50) > 0 and i < len(e50): pt["ema50"] = _sf(e50.iloc[i])
        if i < len(vw): pt["vwap"] = _sf(vw.iloc[i])
        if i < len(rs): pt["rsi"] = _sf(rs.iloc[i])
        if i < len(ml):
            pt["macd"] = _sf(ml.iloc[i])
            pt["macd_signal"] = _sf(ms_l.iloc[i])
            pt["macd_hist"] = _sf(mh_s.iloc[i])
        if i < len(bbu):
            pt["bb_upper"] = _sf(bbu.iloc[i])
            pt["bb_lower"] = _sf(bbl.iloc[i])
        chart.append(pt)

    # Detect signal markers
    signals = []
    for i in range(1, len(chart)):
        p, q = chart[i], chart[i - 1]
        if p.get("macd") is not None and q.get("macd") is not None:
            if p["macd"] > (p.get("macd_signal") or 0) and q["macd"] <= (q.get("macd_signal") or 0):
                signals.append({"date": p["date"], "type": "buy", "reason": "MACD Bullish Crossover", "price": p["close"]})
            if p["macd"] < (p.get("macd_signal") or 0) and q["macd"] >= (q.get("macd_signal") or 0):
                signals.append({"date": p["date"], "type": "sell", "reason": "MACD Bearish Crossover", "price": p["close"]})
        if p.get("rsi") is not None:
            if p["rsi"] < 30 and (q.get("rsi") or 50) >= 30:
                signals.append({"date": p["date"], "type": "buy", "reason": f"RSI Oversold ({p['rsi']})", "price": p["close"]})
            if p["rsi"] > 70 and (q.get("rsi") or 50) <= 70:
                signals.append({"date": p["date"], "type": "sell", "reason": f"RSI Overbought ({p['rsi']})", "price": p["close"]})

    n = news_agent(symbol)
    ha = historical_agent(symbol)
    sa = strategy_agent(symbol)
    sc = score_stock(n, ha, sa)

    # Detect recognized chart patterns and algo signatures
    from algo_kb import detect_algo_patterns
    patterns = detect_algo_patterns(chart)

    return {
        "symbol": symbol,
        "name": stock_dict.get(symbol, symbol),
        "chart_data": chart,
        "signals": signals,
        "patterns": patterns,
        "news": n, "historical": ha, "strategy": sa,
        "scores": sc,
        "support_resistance": ha.get("support_resistance", {}),
    }


# ══════════════════════════════════════════════════════════════
# LIVE MONITORING
# ══════════════════════════════════════════════════════════════

def live_monitor(symbol):
    try:
        ticker = yf.Ticker(symbol)
        h5 = ticker.history(period="5d", interval="5m")
        if h5.empty:
            return {"error": "No intraday data"}

        c, h_s, l_s, v_s = h5["Close"], h5["High"], h5["Low"], h5["Volume"]
        cur = float(c.iloc[-1])

        # Trend prediction (linear slope)
        recent = c.tail(20).values
        if len(recent) > 1:
            slope = float(np.polyfit(np.arange(len(recent)), recent, 1)[0])
            pred = cur + slope * 5
            tdir = "up" if slope > 0 else "down"
        else:
            slope, pred, tdir = 0, cur, "flat"

        rsi_v = float(calc_rsi(c).iloc[-1]) if len(c) > 14 else 50
        avg_v = float(v_s.tail(50).mean()) if len(v_s) > 50 else float(v_s.mean())
        cur_v = float(v_s.tail(5).mean())
        vol_spike = cur_v > avg_v * 2
        vwap_v = float(calc_vwap(h_s, l_s, c, v_s).iloc[-1])
        above_vwap = cur > vwap_v

        sigs = []
        if rsi_v < 30: sigs.append({"type": "buy", "reason": f"RSI oversold ({rsi_v:.0f})"})
        elif rsi_v > 70: sigs.append({"type": "sell", "reason": f"RSI overbought ({rsi_v:.0f})"})
        if vol_spike: sigs.append({"type": "alert", "reason": "Volume spike (2x+)"})
        sigs.append({"type": "info",
                      "reason": f"{'Above' if above_vwap else 'Below'} VWAP ({'bullish' if above_vwap else 'bearish'})"})

        return {
            "symbol": symbol, "current_price": round(cur, 2),
            "predicted_price": round(pred, 2), "trend_direction": tdir,
            "slope": round(slope, 4), "rsi": round(rsi_v, 1),
            "vwap": round(vwap_v, 2), "above_vwap": above_vwap,
            "volume_spike": vol_spike,
            "volume_ratio": round(cur_v / avg_v, 2) if avg_v > 0 else 1,
            "signals": sigs,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
        }
    except Exception as e:
        return {"error": str(e)}
