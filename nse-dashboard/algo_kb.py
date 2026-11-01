"""
Knowledge Base of Best Technical & Quantitative Trading Algorithms
Used for automated recognition, educational dictionary, and interactive explanation tooltips.
"""

ALGO_DIRECTORY = {
    "hammer": {
        "id": "hammer",
        "name": "Hammer Candlestick Pattern",
        "category": "Price Action & Reversal",
        "badge": "Bullish Reversal",
        "win_rate_est": "64% - 71%",
        "best_timeframe": "15m, 1h, Daily",
        "summary": "A single candlestick pattern with a small body near the top and a long lower shadow at least 2x the body length, occurring after a decline.",
        "how_it_works": "Sellers pushed prices down sharply during the session, but strong buyers stepped in before the close, rejecting the lower levels and pushing prices back near the open.",
        "entry_rule": "Enter on the break of the hammer's high with confirmation on next candle.",
        "stop_loss_rule": "Place Stop Loss 0.5% - 1% below the low of the hammer shadow.",
        "target_rule": "Target 1.5x to 2x the risk (Risk-Reward 1:2) or prior swing resistance.",
        "icon": "🔨"
    },
    "bullish_engulfing": {
        "id": "bullish_engulfing",
        "name": "Bullish Engulfing Pattern",
        "category": "Price Action & Momentum",
        "badge": "High Conviction Reversal",
        "win_rate_est": "67% - 74%",
        "best_timeframe": "15m, 1h, 4h",
        "summary": "A small red candle followed immediately by a large green candle whose body completely covers or 'engulfs' the preceding candle's body.",
        "how_it_works": "Shows complete capitulation of sellers and a decisive surge in buying volume, often signaling the onset of a new upward trend.",
        "entry_rule": "Buy on the close of the engulfing candle or on a shallow retest of its mid-point.",
        "stop_loss_rule": "Below the low of the engulfing candle.",
        "target_rule": "Minimum 2:1 RR targeting recent swing highs.",
        "icon": "🟢"
    },
    "vwap_pullback": {
        "id": "vwap_pullback",
        "name": "Institutional VWAP Pullback Alpha",
        "category": "Quantitative & Order Flow",
        "badge": "Institutional Trend-Following",
        "win_rate_est": "72% - 78%",
        "best_timeframe": "5m, 15m",
        "summary": "Volume-Weighted Average Price (VWAP) represents the true benchmark price paid by institutional participants over the trading session.",
        "how_it_works": "When a trending stock pulls back to the VWAP line and prints a green rejection bar on above-average volume, institutions are defending their average entry price.",
        "entry_rule": "Buy when price touches VWAP from above and closes back over the VWAP line with volume expansion.",
        "stop_loss_rule": "2 ATR or 0.75% below VWAP.",
        "target_rule": "Intraday high or upper 2nd Standard Deviation band.",
        "icon": "📈"
    },
    "ema_golden_cross": {
        "id": "ema_golden_cross",
        "name": "EMA 9 / 21 Dynamic Trend Alignment",
        "category": "Trend Following",
        "badge": "Trend Momentum",
        "win_rate_est": "65% - 72%",
        "best_timeframe": "15m, 1h, Daily",
        "summary": "Fast Exponential Moving Average (EMA 9) crosses above slower EMA 21 while price remains elevated above EMA 50.",
        "how_it_works": "Confirms momentum acceleration and filters out sideways noise. Smooths out whipsaws while riding strong sustained trends.",
        "entry_rule": "Enter upon confirmation of 9 EMA crossing above 21 EMA with slope upward.",
        "stop_loss_rule": "Trailing stop loss anchored just below the 21 EMA curve.",
        "target_rule": "Hold until 9 EMA crosses back below 21 EMA or fixed 3:1 RR.",
        "icon": "✨"
    },
    "rsi_divergence": {
        "id": "rsi_divergence",
        "name": "RSI Bullish Regular Divergence",
        "category": "Oscillator & Momentum",
        "badge": "Early Turning Point",
        "win_rate_est": "68% - 75%",
        "best_timeframe": "15m, 1h",
        "summary": "Price forms lower lows while the Relative Strength Index (RSI) oscillator forms higher lows in oversold territory (< 35).",
        "how_it_works": "Indicates that while price dropped further, downward velocity and selling power dried up significantly, anticipating a sharp mean reversion.",
        "entry_rule": "Enter upon a bullish candle close right after the divergence pivot is confirmed.",
        "stop_loss_rule": "Right beneath the lowest price swing low.",
        "target_rule": "RSI 50 line for T1, and RSI 70 overbought boundary for T2.",
        "icon": "⚡"
    },
    "macd_histogram_expansion": {
        "id": "macd_histogram_expansion",
        "name": "MACD Zero-Line Acceleration",
        "category": "Momentum & Velocity",
        "badge": "Breakout Accelerator",
        "win_rate_est": "63% - 70%",
        "best_timeframe": "15m, 30m, 1h",
        "summary": "MACD line crosses the signal line and accelerates upward through the zero line with green histogram expansion.",
        "how_it_works": "Indicates transition from negative momentum to strong sustained positive cycle across two independent moving average windows.",
        "entry_rule": "Enter on the second consecutive expanding green histogram bar.",
        "stop_loss_rule": "Recent swing low or 1.5x ATR.",
        "target_rule": "Exit when histogram begins declining for 2 consecutive bars.",
        "icon": "📊"
    },
    "breakout_volume": {
        "id": "breakout_volume",
        "name": "20-Day Range Breakout + Volume Surge",
        "category": "Volatility & Range Expansion",
        "badge": "High Alpha Breakout",
        "win_rate_est": "70% - 76%",
        "best_timeframe": "1h, Daily",
        "summary": "Price decisively breaches the 20-day high resistance level on volume exceeding 150% of the 20-day average volume.",
        "how_it_works": "Overcoming previous supply zones with heavy volume indicates genuine institutional participation rather than retail traps.",
        "entry_rule": "Enter when candle closes above the 20-day resistance line.",
        "stop_loss_rule": "Inside the broken resistance level (acting as new support).",
        "target_rule": "Measured move equal to the previous consolidation range height.",
        "icon": "🚀"
    }
}

def detect_algo_patterns(chart_data):
    """
    Scans candlestick and indicator records to tag identified patterns.
    Returns list of detected patterns with timestamps, names, descriptions, and rule links.
    """
    if not chart_data or len(chart_data) < 5:
        return []

    detected = []

    for i in range(2, len(chart_data)):
        cur = chart_data[i]
        prev = chart_data[i-1]
        
        o, h, l, c = cur.get("open"), cur.get("high"), cur.get("low"), cur.get("close")
        if None in (o, h, l, c):
            continue

        body = abs(c - o)
        candle_range = h - l
        lower_shadow = min(o, c) - l
        upper_shadow = h - max(o, c)

        # 1. Hammer Pattern
        if candle_range > 0 and (lower_shadow >= 2 * body) and (upper_shadow <= 0.25 * body) and (body / candle_range < 0.4):
            detected.append({
                "algo_id": "hammer",
                "name": "Hammer Pattern",
                "date": cur.get("date"),
                "price": c,
                "badge": "Bullish Reversal",
                "description": f"Hammer observed on {cur.get('date')} at ₹{c:,.2f} with 2x lower rejection wick.",
                "type": "bullish"
            })

        # 2. Bullish Engulfing
        p_o, p_c = prev.get("open"), prev.get("close")
        if p_o is not None and p_c is not None:
            if p_c < p_o and c > o and c >= p_o and o <= p_c:
                detected.append({
                    "algo_id": "bullish_engulfing",
                    "name": "Bullish Engulfing",
                    "date": cur.get("date"),
                    "price": c,
                    "badge": "High Conviction Reversal",
                    "description": f"Bullish engulfing candle completely engulfed previous red bar at ₹{c:,.2f}.",
                    "type": "bullish"
                })

        # 3. EMA Golden Cross (9 over 21)
        e9_cur = cur.get("ema9")
        e21_cur = cur.get("ema21")
        e9_prev = prev.get("ema9")
        e21_prev = prev.get("ema21")
        if None not in (e9_cur, e21_cur, e9_prev, e21_prev):
            if e9_cur > e21_cur and e9_prev <= e21_prev:
                detected.append({
                    "algo_id": "ema_golden_cross",
                    "name": "EMA 9/21 Golden Cross",
                    "date": cur.get("date"),
                    "price": c,
                    "badge": "Trend Momentum",
                    "description": f"EMA 9 dynamically crossed above EMA 21 on {cur.get('date')}.",
                    "type": "bullish"
                })

        # 4. VWAP Rejection Bounce
        vwap = cur.get("vwap")
        if vwap is not None and abs(l - vwap) / vwap < 0.005 and c > vwap and c > o:
            detected.append({
                "algo_id": "vwap_pullback",
                "name": "VWAP Pullback Bounce",
                "date": cur.get("date"),
                "price": c,
                "badge": "Institutional VWAP",
                "description": f"Price pulled back to VWAP (₹{vwap:,.2f}) and bounced higher.",
                "type": "bullish"
            })

        # 5. RSI Divergence / Oversold bounce
        rsi_cur = cur.get("rsi")
        rsi_prev = prev.get("rsi")
        if rsi_cur is not None and rsi_prev is not None:
            if rsi_prev < 32 and rsi_cur >= 32:
                detected.append({
                    "algo_id": "rsi_divergence",
                    "name": "RSI Oversold Mean Reversion",
                    "date": cur.get("date"),
                    "price": c,
                    "badge": "Momentum Reversal",
                    "description": f"RSI recovered above 32 oversold threshold at ₹{c:,.2f}.",
                    "type": "bullish"
                })

    return detected[-8:] # return latest detected patterns
