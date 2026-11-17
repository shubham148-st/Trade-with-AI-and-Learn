import os
import json
"""
Knowledge Base of Best Technical & Quantitative Trading Algorithms
Used for automated recognition, educational dictionary, interactive setup visualizer, and 6-week observation feed.
Professional institutional standards with zero emojis.
"""

from datetime import datetime, timedelta
import random

ALGO_DIRECTORY = {
    "vwap_pullback": {
        "id": "vwap_pullback",
        "name": "Institutional VWAP Pullback Alpha",
        "category": "Quantitative & Order Flow",
        "badge": "Institutional Trend",
        "win_rate_est": "72% - 78%",
        "best_timeframe": "5m, 15m",
        "risk_reward": "1:2.2",
        "icon_name": "Activity",
        "summary": "Volume-Weighted Average Price represents the true benchmark price paid by institutional participants over the trading session.",
        "how_it_works": "When a trending stock pulls back to the VWAP line and prints a green rejection bar on above-average volume, institutions are defending their average execution price.",
        "entry_rule": "Buy when price touches VWAP from above and closes back over the VWAP line with volume expansion.",
        "stop_loss_rule": "1.5 ATR or 0.6% below the session VWAP line.",
        "target_rule": "Session high or upper 2nd Standard Deviation band.",
        "example_chart": {
            "title": "Textbook VWAP Pullback & Institutional Defense",
            "candles": [
                {"i": 0, "o": 100.0, "h": 102.5, "l": 99.5, "c": 102.0, "vol": 120},
                {"i": 1, "o": 102.0, "h": 104.5, "l": 101.5, "c": 104.0, "vol": 150},
                {"i": 2, "o": 104.0, "h": 106.0, "l": 103.0, "c": 105.5, "vol": 180},
                {"i": 3, "o": 105.5, "h": 106.0, "l": 104.0, "c": 104.2, "vol": 90},
                {"i": 4, "o": 104.2, "h": 104.5, "l": 102.8, "c": 103.0, "vol": 80},
                {"i": 5, "o": 103.0, "h": 103.5, "l": 102.2, "c": 102.5, "vol": 75},
                {"i": 6, "o": 102.5, "h": 103.0, "l": 101.8, "c": 102.2, "vol": 110},
                {"i": 7, "o": 102.2, "h": 104.2, "l": 101.9, "c": 103.8, "vol": 210},
                {"i": 8, "o": 103.8, "h": 105.5, "l": 103.5, "c": 105.2, "vol": 190},
                {"i": 9, "o": 105.2, "h": 107.0, "l": 104.8, "c": 106.8, "vol": 230},
                {"i": 10, "o": 106.8, "h": 108.5, "l": 106.2, "c": 108.0, "vol": 260}
            ],
            "indicator": {
                "name": "VWAP Benchmark",
                "color": "#00d4aa",
                "values": [100.5, 101.2, 101.8, 102.0, 102.1, 102.2, 102.3, 102.5, 102.8, 103.2, 103.6]
            },
            "annotations": [
                {"type": "entry", "index": 7, "price": 103.8, "text": "BUY TRIGGER (VWAP Defense)"},
                {"type": "stop_loss", "index": 7, "price": 101.5, "text": "STOP LOSS (Below Low)"},
                {"type": "target", "index": 10, "price": 108.0, "text": "TARGET (1:2.2 R:R Reached)"}
            ]
        }
    },
    "ema_golden_cross": {
        "id": "ema_golden_cross",
        "name": "EMA 9 / 21 Dynamic Trend Alignment",
        "category": "Trend & Momentum",
        "badge": "Trend Momentum",
        "win_rate_est": "66% - 73%",
        "best_timeframe": "15m, 1h, Daily",
        "risk_reward": "1:2.8",
        "icon_name": "TrendingUp",
        "summary": "Fast Exponential Moving Average (EMA 9) crosses decisively above the slower EMA 21 while slope turns sharply positive.",
        "how_it_works": "Smooths out market noise and signals that short-term order velocity has overtaken longer-term averages, initiating sustained trending momentum.",
        "entry_rule": "Enter on the candle close following the 9 EMA crossing above 21 EMA with rising volume.",
        "stop_loss_rule": "Trailing stop loss anchored just below the 21 EMA trajectory.",
        "target_rule": "Ride trend until 9 EMA crosses back below 21 EMA or fixed 1:2.5 R:R.",
        "example_chart": {
            "title": "EMA 9 / 21 Crossover & Momentum Expansion",
            "candles": [
                {"i": 0, "o": 210.0, "h": 211.5, "l": 208.5, "c": 209.0, "vol": 100},
                {"i": 1, "o": 209.0, "h": 210.0, "l": 208.0, "c": 208.5, "vol": 95},
                {"i": 2, "o": 208.5, "h": 211.0, "l": 208.0, "c": 210.5, "vol": 140},
                {"i": 3, "o": 210.5, "h": 213.5, "l": 210.0, "c": 213.0, "vol": 180},
                {"i": 4, "o": 213.0, "h": 215.0, "l": 212.0, "c": 214.5, "vol": 205},
                {"i": 5, "o": 214.5, "h": 216.0, "l": 213.5, "c": 215.8, "vol": 190},
                {"i": 6, "o": 215.8, "h": 218.0, "l": 215.0, "c": 217.5, "vol": 220},
                {"i": 7, "o": 217.5, "h": 220.5, "l": 217.0, "c": 220.0, "vol": 250}
            ],
            "indicator": {
                "name": "EMA 9 (Green) vs EMA 21 (Blue)",
                "color": "#2ed573",
                "values": [209.5, 209.0, 209.6, 211.0, 212.5, 214.0, 215.5, 217.2]
            },
            "annotations": [
                {"type": "entry", "index": 3, "price": 213.0, "text": "GOLDEN CROSS ENTRY"},
                {"type": "stop_loss", "index": 3, "price": 209.5, "text": "SL: Below EMA 21"},
                {"type": "target", "index": 7, "price": 220.0, "text": "TARGET: Trend Peak"}
            ]
        }
    },
    "orb_breakout": {
        "id": "orb_breakout",
        "name": "Opening Range Breakout (ORB 15m)",
        "category": "Volatility & Breakouts",
        "badge": "Session Opener",
        "win_rate_est": "68% - 75%",
        "best_timeframe": "15m",
        "risk_reward": "1:2.0",
        "icon_name": "Zap",
        "summary": "Captures the direction of the market by trading the break of the highest or lowest price established in the initial 15 minutes of the trading day.",
        "how_it_works": "The first 15 minutes absorb overnight orders. A high-volume break of this opening bracket indicates strong institutional commitment in one direction.",
        "entry_rule": "Enter long when the 15-minute candle closes above the high of the initial opening range.",
        "stop_loss_rule": "Midpoint of the opening range or opposite boundary.",
        "target_rule": "1.5x the width of the opening range projected from breakout level.",
        "example_chart": {
            "title": "15-Minute Opening Range Expansion",
            "candles": [
                {"i": 0, "o": 500.0, "h": 508.0, "l": 498.0, "c": 504.0, "vol": 450},
                {"i": 1, "o": 504.0, "h": 507.0, "l": 501.0, "c": 505.5, "vol": 310},
                {"i": 2, "o": 505.5, "h": 512.0, "l": 505.0, "c": 511.0, "vol": 520},
                {"i": 3, "o": 511.0, "h": 515.0, "l": 509.5, "c": 514.5, "vol": 480},
                {"i": 4, "o": 514.5, "h": 519.0, "l": 513.0, "c": 518.0, "vol": 510},
                {"i": 5, "o": 518.0, "h": 524.0, "l": 517.0, "c": 523.5, "vol": 590}
            ],
            "indicator": {
                "name": "ORB High Level (₹508)",
                "color": "#ffa502",
                "values": [508.0, 508.0, 508.0, 508.0, 508.0, 508.0]
            },
            "annotations": [
                {"type": "entry", "index": 2, "price": 511.0, "text": "ORB BREAKOUT BUY"},
                {"type": "stop_loss", "index": 2, "price": 503.0, "text": "SL: Range Midpoint"},
                {"type": "target", "index": 5, "price": 523.5, "text": "TARGET: 2x Range Height"}
            ]
        }
    },
    "bullish_engulfing": {
        "id": "bullish_engulfing",
        "name": "Bullish Engulfing Momentum",
        "category": "Price Action & Structure",
        "badge": "High Conviction",
        "win_rate_est": "67% - 74%",
        "best_timeframe": "15m, 1h, 4h",
        "risk_reward": "1:2.0",
        "icon_name": "ShieldCheck",
        "summary": "A red downward candle followed immediately by a decisive green candle whose body fully encloses or engulfs the preceding red candle.",
        "how_it_works": "Represents total seller exhaustion followed by aggressive institutional liquidity deployment.",
        "entry_rule": "Buy on close of engulfing green bar or retest of its 50% retracement level.",
        "stop_loss_rule": "0.3% below the low of the engulfing candle.",
        "target_rule": "Prior key resistance zone or minimum 1:2 R:R.",
        "example_chart": {
            "title": "Decisive Bullish Engulfing Reversal",
            "candles": [
                {"i": 0, "o": 340.0, "h": 342.0, "l": 335.0, "c": 336.0, "vol": 110},
                {"i": 1, "o": 336.0, "h": 337.0, "l": 330.0, "c": 331.0, "vol": 130},
                {"i": 2, "o": 330.5, "h": 341.0, "l": 329.5, "c": 340.5, "vol": 280},
                {"i": 3, "o": 340.5, "h": 344.0, "l": 339.0, "c": 343.0, "vol": 220},
                {"i": 4, "o": 343.0, "h": 348.0, "l": 342.0, "c": 347.5, "vol": 250},
                {"i": 5, "o": 347.5, "h": 352.0, "l": 346.0, "c": 351.0, "vol": 290}
            ],
            "indicator": {
                "name": "Support Baseline",
                "color": "#ff4757",
                "values": [330.0, 330.0, 330.0, 330.0, 330.0, 330.0]
            },
            "annotations": [
                {"type": "entry", "index": 2, "price": 340.5, "text": "ENGULFING CONFIRMATION"},
                {"type": "stop_loss", "index": 2, "price": 329.0, "text": "SL: Low of Wick"},
                {"type": "target", "index": 5, "price": 351.0, "text": "TARGET: 1:2 R:R"}
            ]
        }
    },
    "hammer": {
        "id": "hammer",
        "name": "Hammer Price Action Rejection",
        "category": "Price Action & Structure",
        "badge": "Bottom Rejection",
        "win_rate_est": "64% - 71%",
        "best_timeframe": "15m, 1h, Daily",
        "risk_reward": "1:2.4",
        "icon_name": "Target",
        "summary": "Candlestick with small upper body and a long lower shadow at least twice the length of the body, indicating lower level rejection.",
        "how_it_works": "Bears hammered prices to new lows, but buyers stepped in forcefully before close, completely rejecting lower prices.",
        "entry_rule": "Buy on the break of the hammer's high candle boundary.",
        "stop_loss_rule": "0.5% below the bottom tip of the lower wick.",
        "target_rule": "1:2 Risk to Reward ratio or preceding swing high.",
        "example_chart": {
            "title": "Lower Shadow Liquidity Rejection Hammer",
            "candles": [
                {"i": 0, "o": 180.0, "h": 181.0, "l": 175.0, "c": 176.0, "vol": 80},
                {"i": 1, "o": 176.0, "h": 177.0, "l": 171.0, "c": 172.0, "vol": 95},
                {"i": 2, "o": 171.5, "h": 173.0, "l": 164.0, "c": 172.5, "vol": 210},
                {"i": 3, "o": 172.5, "h": 177.0, "l": 172.0, "c": 176.0, "vol": 180},
                {"i": 4, "o": 176.0, "h": 180.5, "l": 175.0, "c": 180.0, "vol": 200},
                {"i": 5, "o": 180.0, "h": 185.0, "l": 179.0, "c": 184.5, "vol": 230}
            ],
            "indicator": {
                "name": "Rejection Floor",
                "color": "#00d4aa",
                "values": [164.0, 164.0, 164.0, 164.0, 164.0, 164.0]
            },
            "annotations": [
                {"type": "entry", "index": 3, "price": 173.5, "text": "ENTRY: Hammer High Break"},
                {"type": "stop_loss", "index": 2, "price": 163.5, "text": "SL: Below Hammer Wick"},
                {"type": "target", "index": 5, "price": 184.5, "text": "TARGET: Resistance Pivot"}
            ]
        }
    },
    "rsi_divergence": {
        "id": "rsi_divergence",
        "name": "RSI Bullish Regular Divergence",
        "category": "Mean Reversion & Oscillators",
        "badge": "Early Reversal",
        "win_rate_est": "68% - 75%",
        "best_timeframe": "15m, 1h",
        "risk_reward": "1:2.6",
        "icon_name": "BarChart2",
        "summary": "Price establishes lower swing lows while RSI oscillator registers higher swing lows inside oversold territory (< 35).",
        "how_it_works": "Downside velocity and selling volume are exhausting despite lower prices, anticipating a sharp mean reversion to fair value.",
        "entry_rule": "Enter upon confirmation of a green pivot candle with RSI breaking above its signal line.",
        "stop_loss_rule": "Directly under the lower price pivot swing low.",
        "target_rule": "RSI 50 neutral centerline (Target 1) and RSI 70 overbought boundary (Target 2).",
        "example_chart": {
            "title": "Classic RSI Oscillator Divergence",
            "candles": [
                {"i": 0, "o": 850.0, "h": 855.0, "l": 830.0, "c": 832.0, "vol": 140},
                {"i": 1, "o": 832.0, "h": 842.0, "l": 830.0, "c": 840.0, "vol": 110},
                {"i": 2, "o": 840.0, "h": 841.0, "l": 822.0, "c": 824.0, "vol": 160},
                {"i": 3, "o": 824.0, "h": 836.0, "l": 823.0, "c": 835.0, "vol": 220},
                {"i": 4, "o": 835.0, "h": 850.0, "l": 834.0, "c": 848.0, "vol": 240},
                {"i": 5, "o": 848.0, "h": 865.0, "l": 846.0, "c": 862.0, "vol": 280}
            ],
            "indicator": {
                "name": "RSI Divergence Slope (28 -> 36)",
                "color": "#a855f7",
                "values": [830.0, 831.0, 832.5, 835.0, 838.0, 842.0]
            },
            "annotations": [
                {"type": "entry", "index": 3, "price": 835.0, "text": "RSI DIVERGENCE ENTRY"},
                {"type": "stop_loss", "index": 2, "price": 820.0, "text": "SL: Swing Low"},
                {"type": "target", "index": 5, "price": 862.0, "text": "TARGET: Mean Reversion"}
            ]
        }
    },
    "breakout_volume": {
        "id": "breakout_volume",
        "name": "20-Day Range Breakout + Volume Surge",
        "category": "Volatility & Breakouts",
        "badge": "Institutional Breakout",
        "win_rate_est": "71% - 77%",
        "best_timeframe": "1h, Daily",
        "risk_reward": "1:3.0",
        "icon_name": "Layers",
        "summary": "Price breaches the multi-week resistance barrier on volume exceeding 150% of the 20-day moving average volume.",
        "how_it_works": "Overcoming previous supply zones with massive volume indicates institutional block orders rather than retail speculation.",
        "entry_rule": "Buy on candle close breaking above the 20-day resistance line with volume confirmation.",
        "stop_loss_rule": "Just below the broken resistance level, which now acts as confirmed support.",
        "target_rule": "Measured move equal to the vertical height of the preceding consolidation channel.",
        "example_chart": {
            "title": "Multi-Week Range Breakout with Volume Expansion",
            "candles": [
                {"i": 0, "o": 1200.0, "h": 1215.0, "l": 1195.0, "c": 1210.0, "vol": 110},
                {"i": 1, "o": 1210.0, "h": 1218.0, "l": 1202.0, "c": 1208.0, "vol": 105},
                {"i": 2, "o": 1208.0, "h": 1222.0, "l": 1205.0, "c": 1220.0, "vol": 130},
                {"i": 3, "o": 1220.0, "h": 1245.0, "l": 1218.0, "c": 1242.0, "vol": 380},
                {"i": 4, "o": 1242.0, "h": 1255.0, "l": 1238.0, "c": 1252.0, "vol": 310},
                {"i": 5, "o": 1252.0, "h": 1272.0, "l": 1250.0, "c": 1270.0, "vol": 340}
            ],
            "indicator": {
                "name": "20-Day Resistance (₹1222)",
                "color": "#ef4444",
                "values": [1222.0, 1222.0, 1222.0, 1222.0, 1222.0, 1222.0]
            },
            "annotations": [
                {"type": "entry", "index": 3, "price": 1242.0, "text": "BREAKOUT + 2.5x VOL"},
                {"type": "stop_loss", "index": 3, "price": 1218.0, "text": "SL: Below Broken Level"},
                {"type": "target", "index": 5, "price": 1270.0, "text": "TARGET: 1:3 R:R"}
            ]
        }
    },
    "supertrend_pivot": {
        "id": "supertrend_pivot",
        "name": "Supertrend Trailing Pivot Reversal",
        "category": "Trend & Momentum",
        "badge": "Trend Follower",
        "win_rate_est": "67% - 73%",
        "best_timeframe": "15m, 1h",
        "risk_reward": "1:2.4",
        "icon_name": "Compass",
        "summary": "Utilizes Average True Range volatility bands to trail prices and generate buy signals when price closes above the dynamic band.",
        "how_it_works": "Filters market noise by expanding bands in high-volatility sessions and tightening in quiet consolidations.",
        "entry_rule": "Enter long on the first candle close turning Supertrend from red (bearish) to green (bullish).",
        "stop_loss_rule": "Dynamic stop trailed along the green Supertrend support line.",
        "target_rule": "Hold position until Supertrend turns red or fixed 2.5x initial risk.",
        "example_chart": {
            "title": "Supertrend Dynamic Pivot Flip",
            "candles": [
                {"i": 0, "o": 620.0, "h": 622.0, "l": 615.0, "c": 616.0, "vol": 90},
                {"i": 1, "o": 616.0, "h": 618.0, "l": 612.0, "c": 614.0, "vol": 85},
                {"i": 2, "o": 614.0, "h": 625.0, "l": 613.5, "c": 624.5, "vol": 210},
                {"i": 3, "o": 624.5, "h": 629.0, "l": 623.0, "c": 628.0, "vol": 180},
                {"i": 4, "o": 628.0, "h": 634.0, "l": 626.5, "c": 633.0, "vol": 195},
                {"i": 5, "o": 633.0, "h": 640.0, "l": 631.5, "c": 638.5, "vol": 240}
            ],
            "indicator": {
                "name": "Supertrend Support Band",
                "color": "#10b981",
                "values": [624.0, 622.0, 616.0, 618.5, 622.0, 626.0]
            },
            "annotations": [
                {"type": "entry", "index": 2, "price": 624.5, "text": "SUPERTREND BULLISH FLIP"},
                {"type": "stop_loss", "index": 2, "price": 615.0, "text": "SL: Green Band Base"},
                {"type": "target", "index": 5, "price": 638.5, "text": "TARGET: 1:2.4 R:R"}
            ]
        }
    },
    "bollinger_squeeze": {
        "id": "bollinger_squeeze",
        "name": "Bollinger Bands Volatility Squeeze",
        "category": "Volatility & Breakouts",
        "badge": "Volatility Expansion",
        "win_rate_est": "69% - 76%",
        "best_timeframe": "30m, 1h, Daily",
        "risk_reward": "1:2.8",
        "icon_name": "Maximize2",
        "summary": "Bollinger Bands contract tightly inside Keltner Channels, followed by an explosive outward expansion as price breaches the upper band.",
        "how_it_works": "Volatility is cyclical. Low-volatility periods store energy that inevitably resolves in rapid directional expansion.",
        "entry_rule": "Buy on the first bar closing above upper Bollinger Band with bandwidth expanding.",
        "stop_loss_rule": "Middle 20 SMA line (basis line) of the Bollinger Bands.",
        "target_rule": "2x the width of the squeeze band from the breakout point.",
        "example_chart": {
            "title": "Bollinger Band Squeeze & Outward Surge",
            "candles": [
                {"i": 0, "o": 92.0, "h": 92.8, "l": 91.5, "c": 92.2, "vol": 70},
                {"i": 1, "o": 92.2, "h": 92.7, "l": 91.8, "c": 92.4, "vol": 65},
                {"i": 2, "o": 92.4, "h": 92.9, "l": 92.0, "c": 92.5, "vol": 60},
                {"i": 3, "o": 92.5, "h": 95.2, "l": 92.4, "c": 95.0, "vol": 260},
                {"i": 4, "o": 95.0, "h": 97.0, "l": 94.5, "c": 96.8, "vol": 230},
                {"i": 5, "o": 96.8, "h": 99.5, "l": 96.2, "c": 99.0, "vol": 290}
            ],
            "indicator": {
                "name": "Upper Band Breakout",
                "color": "#38bdf8",
                "values": [93.0, 92.9, 92.8, 93.8, 95.5, 97.2]
            },
            "annotations": [
                {"type": "entry", "index": 3, "price": 95.0, "text": "SQUEEZE BREAKOUT ENTRY"},
                {"type": "stop_loss", "index": 3, "price": 92.2, "text": "SL: 20 SMA Baseline"},
                {"type": "target", "index": 5, "price": 99.0, "text": "TARGET: Expansion Peak"}
            ]
        }
    },
    "liquidity_sweep": {
        "id": "liquidity_sweep",
        "name": "Institutional Liquidity Sweep & Retest",
        "category": "Quantitative & Order Flow",
        "badge": "Smart Money",
        "win_rate_est": "74% - 81%",
        "best_timeframe": "5m, 15m, 1h",
        "risk_reward": "1:3.2",
        "icon_name": "Cpu",
        "summary": "Price briefly spikes past obvious retail support or resistance to trigger stop orders and capture liquidity, then immediately reverses.",
        "how_it_works": "Institutional orders require vast liquidity. Sweeping retail stops fills institutional buy limits before markup.",
        "entry_rule": "Buy once price closes back inside the previous key swing range after sweeping the low.",
        "stop_loss_rule": "Directly below the extreme sweep wick low.",
        "target_rule": "Opposite side liquidity pool (previous swing high).",
        "example_chart": {
            "title": "Smart Money Liquidity Sweep & Rapid Reversal",
            "candles": [
                {"i": 0, "o": 410.0, "h": 414.0, "l": 406.0, "c": 408.0, "vol": 120},
                {"i": 1, "o": 408.0, "h": 410.0, "l": 405.0, "c": 406.0, "vol": 130},
                {"i": 2, "o": 406.0, "h": 407.0, "l": 398.0, "c": 407.5, "vol": 340},
                {"i": 3, "o": 407.5, "h": 413.0, "l": 406.5, "c": 412.0, "vol": 250},
                {"i": 4, "o": 412.0, "h": 418.0, "l": 411.0, "c": 417.0, "vol": 280},
                {"i": 5, "o": 417.0, "h": 424.0, "l": 416.0, "c": 423.0, "vol": 310}
            ],
            "indicator": {
                "name": "Retail Support Level (₹405)",
                "color": "#e11d48",
                "values": [405.0, 405.0, 405.0, 405.0, 405.0, 405.0]
            },
            "annotations": [
                {"type": "entry", "index": 2, "price": 407.5, "text": "SWEEP RECLAIM ENTRY"},
                {"type": "stop_loss", "index": 2, "price": 397.0, "text": "SL: Sweep Low"},
                {"type": "target", "index": 5, "price": 423.0, "text": "TARGET: Buy-Side Liquidity"}
            ]
        }
    },
    "donchian_turtle": {
        "id": "donchian_turtle",
        "name": "Donchian 20-Day Turtle Trend Channel",
        "category": "Trend & Momentum",
        "badge": "Trend Follower",
        "win_rate_est": "63% - 70%",
        "best_timeframe": "1h, Daily",
        "risk_reward": "1:3.5",
        "icon_name": "GitBranch",
        "summary": "Classic trend-following system originating from the Turtle Traders, entering on 20-day highs and trailing on 10-day lows.",
        "how_it_works": "Accepts lower win rate for massive asymmetric payoff. Captures large macro trends and cuts losers early.",
        "entry_rule": "Buy whenever today's price breaches the 20-day high channel ceiling.",
        "stop_loss_rule": "2 ATR below entry price or 10-day channel low.",
        "target_rule": "Trailing exit triggered when price touches 10-day low channel.",
        "example_chart": {
            "title": "Donchian Channel Breakout & Trend Extension",
            "candles": [
                {"i": 0, "o": 150.0, "h": 152.0, "l": 149.0, "c": 151.0, "vol": 90},
                {"i": 1, "o": 151.0, "h": 153.0, "l": 150.0, "c": 152.5, "vol": 100},
                {"i": 2, "o": 152.5, "h": 157.0, "l": 152.0, "c": 156.0, "vol": 210},
                {"i": 3, "o": 156.0, "h": 160.0, "l": 155.0, "c": 159.0, "vol": 190},
                {"i": 4, "o": 159.0, "h": 164.0, "l": 158.0, "c": 163.5, "vol": 230},
                {"i": 5, "o": 163.5, "h": 168.0, "l": 162.0, "c": 167.0, "vol": 260}
            ],
            "indicator": {
                "name": "20-Day Channel Ceiling (₹153)",
                "color": "#6366f1",
                "values": [153.0, 153.0, 153.0, 155.0, 158.0, 161.0]
            },
            "annotations": [
                {"type": "entry", "index": 2, "price": 156.0, "text": "TURTLE CHANNEL BREAKOUT"},
                {"type": "stop_loss", "index": 2, "price": 151.0, "text": "SL: 2 ATR Below"},
                {"type": "target", "index": 5, "price": 167.0, "text": "TARGET: 1:3.5 R:R Hit"}
            ]
        }
    },
    "macd_histogram_expansion": {
        "id": "macd_histogram_expansion",
        "name": "MACD Zero-Line Acceleration",
        "category": "Mean Reversion & Oscillators",
        "badge": "Momentum Thrust",
        "win_rate_est": "65% - 71%",
        "best_timeframe": "15m, 30m, 1h",
        "risk_reward": "1:2.0",
        "icon_name": "BarChart2",
        "summary": "MACD line crosses the signal line and accelerates upward through the zero line accompanied by green histogram expansion.",
        "how_it_works": "Signifies structural transition from negative drift to positive acceleration across two independent moving average windows.",
        "entry_rule": "Enter on the second consecutive expanding green histogram bar above zero.",
        "stop_loss_rule": "Prior swing low or 1.5 ATR.",
        "target_rule": "Exit when histogram decreases for two consecutive bars.",
        "example_chart": {
            "title": "MACD Zero-Line Crossing & Bar Expansion",
            "candles": [
                {"i": 0, "o": 72.0, "h": 72.5, "l": 71.0, "c": 71.5, "vol": 80},
                {"i": 1, "o": 71.5, "h": 72.2, "l": 71.2, "c": 72.0, "vol": 95},
                {"i": 2, "o": 72.0, "h": 73.8, "l": 71.8, "c": 73.5, "vol": 160},
                {"i": 3, "o": 73.5, "h": 75.0, "l": 73.2, "c": 74.8, "vol": 180},
                {"i": 4, "o": 74.8, "h": 76.5, "l": 74.5, "c": 76.0, "vol": 210},
                {"i": 5, "o": 76.0, "h": 78.0, "l": 75.8, "c": 77.5, "vol": 220}
            ],
            "indicator": {
                "name": "MACD Zero-Line Threshold",
                "color": "#06b6d4",
                "values": [72.0, 72.0, 72.0, 72.0, 72.0, 72.0]
            },
            "annotations": [
                {"type": "entry", "index": 2, "price": 73.5, "text": "HISTOGRAM SURGE BUY"},
                {"type": "stop_loss", "index": 2, "price": 71.2, "text": "SL: Swing Base"},
                {"type": "target", "index": 5, "price": 77.5, "text": "TARGET: Momentum Exhaustion"}
            ]
        }
    }
}

# ── Observed Signal Feed: derived only from actual Yahoo Finance OHLCV ───────
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import yfinance as yf
import pandas as pd

NSE_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS",
    "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS", "SUNPHARMA.NS", "WIPRO.NS",
    "BAJFINANCE.NS", "TATASTEEL.NS", "POWERGRID.NS", "NTPC.NS"
]

_HISTORY_CACHE = {}
_HISTORY_CACHE_TTL = 900
_OBSERVED_CACHE = {"timestamp": 0, "signals": []}
_OBSERVED_CACHE_TTL = 300
_CACHE_LOCK = __import__("threading").RLock()


def _get_real_chart(symbol):
    """Fetch and normalize real daily OHLCV; cache briefly to limit upstream requests."""
    now = time.time()
    with _CACHE_LOCK:
        cached = _HISTORY_CACHE.get(symbol)
        if cached and now - cached["timestamp"] < _HISTORY_CACHE_TTL:
            return cached["chart"]

    try:
        hist = yf.Ticker(symbol).history(period="3mo", interval="1d", auto_adjust=False)
        if hist is None or hist.empty:
            return []
        hist = hist.dropna(subset=["Open", "High", "Low", "Close"])
        if hist.empty:
            return []

        close = hist["Close"]
        ema9 = close.ewm(span=9, adjust=False).mean()
        ema21 = close.ewm(span=21, adjust=False).mean()
        typical = (hist["High"] + hist["Low"] + close) / 3
        volume = hist["Volume"].fillna(0)
        cumulative_volume = volume.cumsum().replace(0, float("nan"))
        vwap = (typical * volume).cumsum() / cumulative_volume

        chart = []
        for i, (ts, row) in enumerate(hist.iterrows()):
            values = [row["Open"], row["High"], row["Low"], row["Close"]]
            if any(pd.isna(v) for v in values):
                continue
            chart.append({
                "date": ts.strftime("%Y-%m-%d"),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
                "ema9": float(ema9.iloc[i]) if not pd.isna(ema9.iloc[i]) else None,
                "ema21": float(ema21.iloc[i]) if not pd.isna(ema21.iloc[i]) else None,
                "vwap": float(vwap.iloc[i]) if not pd.isna(vwap.iloc[i]) else None,
            })
        with _CACHE_LOCK:
            _HISTORY_CACHE[symbol] = {"timestamp": now, "chart": chart}
        return chart
    except Exception as exc:
        print(f"[algo-feed] {symbol} history unavailable: {exc}")
        return []


def _make_observed_signal(symbol, chart, pattern, index):
    """Build a chart overlay from the exact historical bars that formed the pattern."""
    window_start = max(0, index - 11)
    bars = chart[window_start:index + 1]
    if not bars:
        return None
    candles = [{"date": b["date"], "o": b["open"], "h": b["high"],
                "l": b["low"], "c": b["close"]} for b in bars]
    closes = [b["close"] for b in bars]
    ema_values = []
    ema = closes[0]
    alpha = 2 / 6
    for value in closes:
        ema = value * alpha + ema * (1 - alpha)
        ema_values.append(round(ema, 2))

    entry = float(pattern.get("price") or candles[-1]["c"])
    recent_lows = [b["l"] for b in bars[-5:]]
    recent_highs = [b["h"] for b in bars[-5:]]
    risk = max(entry - min(recent_lows), entry * 0.005)
    stop = round(entry - risk, 2)
    target = round(entry + risk * 2, 2)
    algo_id = pattern.get("algo_id", "")
    algo = ALGO_DIRECTORY.get(algo_id, {})
    date = pattern.get("date") or bars[-1]["date"]
    try:
        days_ago = max(0, (datetime.now().date() - datetime.strptime(date, "%Y-%m-%d").date()).days)
    except Exception:
        days_ago = 0

    return {
        "id": f"{symbol}-{algo_id}-{date}",
        "algo_id": algo_id,
        "algo_name": algo.get("name", pattern.get("name", "Market Pattern")),
        "category": algo.get("category", "Price Action & Structure"),
        "symbol": symbol,
        "stock_clean": symbol.replace(".NS", ""),
        "timestamp": date,
        "date": date,
        "is_today": days_ago == 0,
        "days_ago": days_ago,
        "price": round(entry, 2),
        "confidence": None,
        "status": "Detected",
        "return_pct": None,
        "badge": pattern.get("badge", "Technical Pattern"),
        "explanation": pattern.get("explanation", ""),
        "real_chart": {
            "symbol": symbol,
            "clean_symbol": symbol.replace(".NS", ""),
            "algo_id": algo_id,
            "entry_price": round(entry, 2),
            "stop_loss": stop,
            "target_price": target,
            "status": "Detected",
            "candles": candles,
            "indicator_line": {"name": "5-period EMA", "values": ema_values},
        },
    }


def generate_observed_signals():
    """Scan real daily OHLCV; never fabricate prices, wins, confidence or trade outcomes."""
    by_symbol = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(_get_real_chart, symbol): symbol for symbol in NSE_TICKERS}
        for future in as_completed(futures):
            symbol = futures[future]
            try:
                by_symbol[symbol] = future.result()
            except Exception as exc:
                print(f"[algo-feed] {symbol} scan failed: {exc}")
                by_symbol[symbol] = []

    signals = []
    for symbol, chart in by_symbol.items():
        if len(chart) < 5:
            continue
        for pattern in detect_algo_patterns(chart):
            try:
                idx = next(i for i, bar in enumerate(chart)
                           if bar["date"] == pattern.get("date"))
            except StopIteration:
                continue
            item = _make_observed_signal(symbol, chart, pattern, idx)
            if item:
                signals.append(item)
    signals.sort(key=lambda item: (item["date"], item["symbol"]), reverse=True)
    return signals


def get_market_session_status():
    """NSE session status in Asia/Kolkata, independent of the Render server timezone."""
    from zoneinfo import ZoneInfo
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    is_weekday = now.weekday() < 5
    minutes = now.hour * 60 + now.minute
    in_session = is_weekday and 555 <= minutes < 930
    return {
        "is_closed": not in_session,
        "session_badge": "Market in Session" if in_session else "Market Closed",
        "message": "Daily patterns are confirmed from completed OHLCV candles; this feed is not tick-by-tick intraday data.",
        "data_source": "Yahoo Finance daily OHLCV",
    }


def get_observed_feed(filter_type="1D", pattern_id="ALL"):
    global _OBSERVED_CACHE
    now = time.time()
    with _CACHE_LOCK:
        cache_fresh = now - _OBSERVED_CACHE["timestamp"] < _OBSERVED_CACHE_TTL
        cached_signals = _OBSERVED_CACHE["signals"]
    if not cache_fresh:
        fresh = generate_observed_signals()
        with _CACHE_LOCK:
            _OBSERVED_CACHE = {"timestamp": time.time(), "signals": fresh}
            cached_signals = fresh

    all_signals = cached_signals
    ft_norm = (filter_type or "1D").upper()
    latest_date = max((s["date"] for s in all_signals), default=None)
    today = datetime.now().date()

    if ft_norm in ("1D", "TODAY"):
        filtered = [s for s in all_signals if s["date"] == latest_date] if latest_date else []
    elif ft_norm in ("1W", "WEEK"):
        cutoff = today - timedelta(days=7)
        filtered = [s for s in all_signals if datetime.strptime(s["date"], "%Y-%m-%d").date() >= cutoff]
    elif ft_norm in ("1M", "MONTH"):
        cutoff = today - timedelta(days=30)
        filtered = [s for s in all_signals if datetime.strptime(s["date"], "%Y-%m-%d").date() >= cutoff]
    else:
        filtered = list(all_signals)

    if pattern_id and pattern_id.upper() != "ALL":
        filtered = [s for s in filtered if s.get("algo_id") == pattern_id or s.get("algo_name") == pattern_id]

    counts = {}
    for signal in filtered:
        label = signal["date"] if ft_norm not in ("1D", "TODAY") else "Latest"
        counts[label] = counts.get(label, 0) + 1
    timeline = [{"label": label, "count": count} for label, count in sorted(counts.items())[-8:]]

    available_patterns = sorted({s["algo_name"] for s in all_signals})
    return {
        "stats": {
            "total_today": sum(1 for s in all_signals if s["date"] == latest_date) if latest_date else 0,
            "total_all": len(all_signals),
            "active_filter": ft_norm,
            "active_pattern": pattern_id,
            "win_rate": None,
            "count": len(filtered),
            "top_algo": None,
            "market_session": get_market_session_status(),
        },
        "available_patterns": available_patterns,
        "timeline": timeline,
        "signals": filtered,
    }


def detect_algo_patterns(chart_data):
    """Detect confirmed formations from chronological, real OHLCV bars."""
    if not isinstance(chart_data, list) or len(chart_data) < 5:
        return []

    detected = []
    for i in range(1, len(chart_data)):
        cur, prev = chart_data[i], chart_data[i - 1]
        try:
            o, h, low, close = (float(cur[k]) for k in ("open", "high", "low", "close"))
            po, pc = float(prev["open"]), float(prev["close"])
        except (KeyError, TypeError, ValueError):
            continue
        if not all(__import__("math").isfinite(v) for v in (o, h, low, close, po, pc)):
            continue
        if h < max(o, close) or low > min(o, close) or h <= low:
            continue

        date = cur.get("date")
        body = abs(close - o)
        candle_range = h - low
        lower_shadow = min(o, close) - low
        upper_shadow = h - max(o, close)
        body_floor = max(candle_range * 0.02, 1e-9)

        def add(algo_id, name, badge, explanation):
            detected.append({
                "algo_id": algo_id, "name": name, "date": date,
                "price": round(close, 2), "badge": badge,
                "explanation": explanation,
            })

        # Hammer and inverted hammer: small real body with a dominant wick.
        if body >= body_floor and lower_shadow >= 2 * body and upper_shadow <= 0.35 * candle_range:
            add("hammer", "Hammer Reversal", "Candlestick Reversal",
                "Long lower wick and small body indicate rejection of lower prices.")
        if body >= body_floor and upper_shadow >= 2 * body and lower_shadow <= 0.35 * candle_range:
            add("hammer", "Inverted Hammer", "Candlestick Reversal",
                "Long upper wick after a decline can signal a bullish reversal; confirmation is required.")

        # Engulfing patterns use the real bodies of two consecutive candles.
        if pc < po and close > o and o <= pc and close >= po:
            add("bullish_engulfing", "Bullish Engulfing", "Bullish Reversal",
                "Current bullish real body engulfs the prior bearish real body.")
        if pc > po and close < o and o >= pc and close <= po:
            add("bearish_engulfing", "Bearish Engulfing", "Bearish Reversal",
                "Current bearish real body engulfs the prior bullish real body.")

        # EMA cross requires both current and previous indicator values.
        try:
            e9, e21 = float(cur["ema9"]), float(cur["ema21"])
            pe9, pe21 = float(prev["ema9"]), float(prev["ema21"])
            if e9 > e21 and pe9 <= pe21:
                add("ema_golden_cross", "EMA 9/21 Golden Cross", "Trend Momentum",
                    "EMA 9 crossed above EMA 21 on the latest completed bar.")
            elif e9 < e21 and pe9 >= pe21:
                add("ema_golden_cross", "EMA 9/21 Bearish Cross", "Trend Exhaustion",
                    "EMA 9 crossed below EMA 21 on the latest completed bar.")
        except (KeyError, TypeError, ValueError):
            pass

        # Daily 20-bar breakout with volume confirmation (not mislabeled as intraday ORB).
        if i >= 20:
            lookback = chart_data[i - 20:i]
            try:
                prior_high = max(float(bar["high"]) for bar in lookback)
                prior_volumes = [float(bar.get("volume", 0) or 0) for bar in lookback]
                current_volume = float(cur.get("volume", 0) or 0)
                average_volume = sum(prior_volumes) / len(prior_volumes)
                if close > prior_high and pc <= prior_high and average_volume > 0 and current_volume >= 1.5 * average_volume:
                    add("breakout_volume", "20-Day Breakout + Volume", "Volume-Confirmed Breakout",
                        "Close broke the prior 20-session high with volume at least 1.5x its prior 20-session average.")
            except (KeyError, TypeError, ValueError):
                pass

    # Keep the newest confirmed instance of each pattern/date, newest first.
    unique = []
    seen = set()
    for item in reversed(detected):
        key = (item["algo_id"], item["name"], item["date"])
        if key not in seen:
            seen.add(key)
            unique.append(item)
        if len(unique) >= 12:
            break
    return unique
