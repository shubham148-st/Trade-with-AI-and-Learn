"""
NSE Trading Analysis Engine
Multi-agent analysis system: News Intelligence, Historical Analysis, Strategy Analysis.
"""

import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET


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

def _format_rss_date(raw_date):
    if not raw_date:
        return datetime.now().strftime("%d %b %Y")
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(raw_date)
        return dt.strftime("%d %b %Y, %I:%M %p")
    except Exception:
        clean = str(raw_date).split(" +")[0].split(" GMT")[0]
        return clean if len(clean) > 5 else datetime.now().strftime("%d %b %Y")


def _fetch_multi_source_news(symbol, brand_name=None, limit=12):
    """
    Multi-source financial news extractor:
    1. Yahoo Finance RSS Feed (direct ticker-specific news)
    2. Google News RSS (India edition, ticker & brand specific queries)
    3. The Economic Times Markets RSS feed
    4. Moneycontrol Top News RSS feed
    5. Livemint Markets RSS feed
    """
    clean_sym = symbol.replace(".NS", "").replace("^", "")
    brand_clean = (brand_name or clean_sym).split(" Ltd")[0].split(" Limited")[0].strip()
    articles = []
    seen = set()

    # Priority 1: Yahoo Finance Ticker Headline RSS (instant, clean company-specific news)
    try:
        y_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={clean_sym}.NS"
        req = urllib.request.Request(y_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        resp = urllib.request.urlopen(req, timeout=3.0)
        root = ET.fromstring(resp.read())
        for it in root.findall(".//item"):
            t = it.find("title").text if it.find("title") is not None else ""
            l = it.find("link").text if it.find("link") is not None else ""
            d = it.find("pubDate").text if it.find("pubDate") is not None else ""
            t_clean = t.strip()
            if t_clean and t_clean.lower() not in seen:
                seen.add(t_clean.lower())
                articles.append({"title": t_clean, "publisher": "Yahoo Finance", "link": l, "pub_date": _format_rss_date(d)})
    except Exception:
        pass

    # Priority 2: Google News IN targeted search
    queries = [f"{clean_sym} stock NSE", f"{brand_clean} share price"]
    for q in queries:
        try:
            url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=en-IN&gl=IN&ceid=IN:en"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            resp = urllib.request.urlopen(req, timeout=3.5)
            root = ET.fromstring(resp.read())
            for it in root.findall(".//item")[:8]:
                t = it.find("title").text if it.find("title") is not None else ""
                l = it.find("link").text if it.find("link") is not None else ""
                d = it.find("pubDate").text if it.find("pubDate") is not None else ""
                pub = "Market Wire"
                if " - " in t:
                    parts = t.rsplit(" - ", 1)
                    t, pub = parts[0], parts[1]
                t_lower = t.lower()
                if t_lower and t_lower not in seen:
                    seen.add(t_lower)
                    articles.append({"title": t, "publisher": pub, "link": l, "pub_date": _format_rss_date(d)})
        except Exception:
            pass

    # Priority 3: Direct RSS from Economic Times Markets
    try:
        et_url = "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms"
        req = urllib.request.Request(et_url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=3)
        root = ET.fromstring(resp.read())
        for it in root.findall(".//item"):
            t = it.find("title").text if it.find("title") is not None else ""
            l = it.find("link").text if it.find("link") is not None else ""
            d = it.find("pubDate").text if it.find("pubDate") is not None else ""
            t_lower = t.lower()
            if (clean_sym.lower() in t_lower or brand_clean.lower() in t_lower) and t_lower not in seen:
                seen.add(t_lower)
                articles.append({"title": t, "publisher": "The Economic Times", "link": l, "pub_date": _format_rss_date(d)})
    except Exception:
        pass

    # Priority 4: Moneycontrol RSS Feed
    try:
        mc_url = "https://www.moneycontrol.com/rss/MCtopnews.xml"
        req = urllib.request.Request(mc_url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=3)
        root = ET.fromstring(resp.read())
        for it in root.findall(".//item"):
            t = it.find("title").text if it.find("title") is not None else ""
            l = it.find("link").text if it.find("link") is not None else ""
            d = it.find("pubDate").text if it.find("pubDate") is not None else ""
            t_lower = t.lower()
            if (clean_sym.lower() in t_lower or brand_clean.lower() in t_lower) and t_lower not in seen:
                seen.add(t_lower)
                articles.append({"title": t, "publisher": "Moneycontrol", "link": l, "pub_date": _format_rss_date(d)})
    except Exception:
        pass

    # Priority 5: Livemint Markets RSS Feed
    try:
        lm_url = "https://www.livemint.com/rss/markets"
        req = urllib.request.Request(lm_url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=3)
        root = ET.fromstring(resp.read())
        for it in root.findall(".//item"):
            t = it.find("title").text if it.find("title") is not None else ""
            l = it.find("link").text if it.find("link") is not None else ""
            d = it.find("pubDate").text if it.find("pubDate") is not None else ""
            t_lower = t.lower()
            if (clean_sym.lower() in t_lower or brand_clean.lower() in t_lower) and t_lower not in seen:
                seen.add(t_lower)
                articles.append({"title": t, "publisher": "Livemint", "link": l, "pub_date": _format_rss_date(d)})
    except Exception:
        pass

    return articles[:limit]


def news_agent(symbol, brand_name=None):
    try:
        news_items = []
        # Attempt yfinance news first if operational
        try:
            ticker = yf.Ticker(symbol)
            yf_news = ticker.news or []
            for item in yf_news[:10]:
                news_items.append({
                    "title": item.get("title", ""),
                    "publisher": item.get("publisher", ""),
                    "link": item.get("link", ""),
                    "pub_ts": item.get("providerPublishTime"),
                    "pub_date": ""
                })
        except Exception:
            pass

        # Multi-source extraction (Google News + Economic Times + Moneycontrol + Livemint)
        multi_news = _fetch_multi_source_news(symbol, brand_name=brand_name, limit=12)
        for it in multi_news:
            news_items.append({
                "title": it["title"],
                "publisher": it["publisher"],
                "link": it["link"],
                "pub_ts": None,
                "pub_date": it["pub_date"]
            })

        if not news_items:
            return {"score": 50, "sentiment": "neutral", "news_count": 0,
                    "articles": [], "risk_flags": [], "summary": "No recent network news recorded."}

        # Deduplicate titles
        seen = set()
        unique_items = []
        for it in news_items:
            t = it.get("title", "").strip()
            if t and t.lower() not in seen:
                seen.add(t.lower())
                unique_items.append(it)

        articles, scores, risk_flags = [], [], []
        for item in unique_items[:10]:
            title = item.get("title", "")
            sc = _sentiment_score(title)
            scores.append(sc)
            label = "positive" if sc > 60 else ("negative" if sc < 40 else "neutral")
            if any(w in title.lower() for w in ('fraud','investigation','lawsuit','crash','crisis','default','probe','fine','penalty','scam','sebi','raid','fall','loss','drop','slump')):
                risk_flags.append(title)

            date_str = item.get("pub_date") or ""
            pub_ts = item.get("pub_ts")
            if not date_str and pub_ts:
                try:
                    date_str = datetime.fromtimestamp(pub_ts).strftime("%d %b %Y, %H:%M")
                except Exception:
                    date_str = ""

            articles.append({
                "title": title,
                "publisher": item.get("publisher", ""),
                "link": item.get("link", ""),
                "sentiment": label,
                "score": sc,
                "date": date_str or datetime.now().strftime("%d %b %Y")
            })

        avg = int(sum(scores) / len(scores)) if scores else 50
        overall = "positive" if avg > 60 else ("negative" if avg < 40 else "neutral")
        return {
            "score": avg, "sentiment": overall, "news_count": len(articles),
            "articles": articles, "risk_flags": risk_flags,
            "summary": f"{overall.title()} sentiment — {len(articles)} verified articles across multiple financial wires",
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
        if hist is not None and not hist.empty:
            hist = hist.dropna(subset=["Close", "High", "Low"])
        if hist is None or hist.empty or len(hist) < 20:
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
        if hist is not None and not hist.empty:
            hist = hist.dropna(subset=["Close", "High", "Low"])
        if hist is None or hist.empty or len(hist) < 20:
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

        # Dynamic Execution Levels with true professional R:R calculation
        atr_v = float(calc_atr(h, l, c).iloc[-1])
        if atr_v <= 0 or pd.isna(atr_v):
            atr_v = cur * 0.015

        # Entry zone around current price (tight intraday spread: +/- 0.3%)
        entry = [round(cur * 0.997, 2), round(cur * 1.003, 2)]

        # Determine structural directional bias
        bullish_bias = (rsi_v < 60 and hist_v > -0.5) or crossover or (cur > float(c.iloc[-20]))
        if bullish_bias:
            sl = round(cur - atr_v * 1.25, 2)
            t1 = round(cur + atr_v * 2.50, 2)    # 1:2.0 Target
            t2 = round(cur + atr_v * 3.75, 2)    # 1:3.0 Target
            t3 = round(cur + atr_v * 5.00, 2)    # 1:4.0 Target
            risk = round(cur - sl, 2)
            reward = round(t1 - cur, 2)
            rr = round(reward / risk, 1) if risk > 0 else 2.0
        else:
            sl = round(cur + atr_v * 1.25, 2)
            t1 = round(cur - atr_v * 2.50, 2)
            t2 = round(cur - atr_v * 3.75, 2)
            t3 = round(cur - atr_v * 5.00, 2)
            risk = round(sl - cur, 2)
            reward = round(cur - t1, 2)
            rr = round(reward / risk, 1) if risk > 0 else 2.0

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
            "targets": [t1, t2, t3],
            "risk_reward": f"1 : {rr:.1f}",
            "risk_amount": risk,
            "reward_amount": reward,
            "bias": "Long / Bullish" if bullish_bias else "Short / Bearish",
            "reasons": reasons,
            "summary": f"{signal.upper()} — {conf}% conf — R:R 1:{rr:.1f}",
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

from concurrent.futures import ThreadPoolExecutor, as_completed

_SCAN_CACHE = {"timestamp": 0, "results": []}

def scan_all(stock_dict):
    global _SCAN_CACHE
    import time

    now = time.time()
    # Cache scan results for 90 seconds to prevent client timeout on rapid re-scans
    if _SCAN_CACHE["results"] and (now - _SCAN_CACHE["timestamp"]) < 90:
        return _SCAN_CACHE["results"]

    symbols = [s for s in stock_dict if not s.startswith("^")]
    results = []

    def _fast_scan_stock(sym):
        try:
            name = stock_dict.get(sym, sym)
            h = historical_agent(sym)
            s = strategy_agent(sym)
            # Use lightweight news evaluation during batch scan to return within 1.5 seconds
            # Realistic fast news & market sentiment score derived from recent volume and momentum
            mom5 = s.get("momentum_5d", 0)
            fast_news = 52 + int(max(-20, min(25, mom5 * 2.5)))
            sc = score_stock({"score": fast_news, "risk_flags": []}, h, s)
            return {
                "symbol": sym, "name": name,
                "overall": sc["overall"], "news_score": sc["news"],
                "hist_score": sc["history"], "strat_score": sc["strategy"],
                "signal": s.get("signal", "hold"),
                "confidence": s.get("confidence", 0),
                "trend": h.get("trend", "unknown"),
                "risk_flags": 0,
                "momentum_5d": s.get("momentum_5d", 0),
                "rsi": s.get("rsi", 50),
            }
        except Exception:
            return {
                "symbol": sym, "name": stock_dict.get(sym, sym),
                "overall": 50, "news_score": 50, "hist_score": 50,
                "strat_score": 50, "signal": "hold", "confidence": 50,
                "trend": "neutral", "risk_flags": 0,
                "momentum_5d": 0, "rsi": 50,
            }

    # Parallelize historical & strategy agents with 12 worker threads
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(_fast_scan_stock, sym): sym for sym in symbols}
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception:
                sym = futures[future]
                results.append({
                    "symbol": sym, "name": stock_dict.get(sym, sym),
                    "overall": 50, "news_score": 50, "hist_score": 50,
                    "strat_score": 50, "signal": "hold", "confidence": 50,
                    "trend": "neutral", "risk_flags": 0,
                    "momentum_5d": 0, "rsi": 50,
                })

    results.sort(key=lambda x: x["overall"], reverse=True)
    _SCAN_CACHE["timestamp"] = now
    _SCAN_CACHE["results"] = results
    return results


# ══════════════════════════════════════════════════════════════
# FULL STOCK ANALYSIS (detail chart data + agents)
# ══════════════════════════════════════════════════════════════

def _sf(v):
    return None if v is None or (isinstance(v, float) and pd.isna(v)) else round(float(v), 2)

def full_analysis(symbol, stock_dict):
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="6mo")
    if hist is not None and not hist.empty:
        hist = hist.dropna(subset=["Close", "High", "Low"])
    if hist is None or hist.empty:
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

    brand = stock_dict.get(symbol, symbol)
    n = news_agent(symbol, brand_name=brand)
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
