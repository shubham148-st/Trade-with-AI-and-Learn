"""
Paper Trading Simulation Engine
Maintains in-memory and persistent virtual balances, orders, positions, and logs.
Evaluates algorithmic rule executions and updates live P&L.
"""

import time
import json
import os
from datetime import datetime

STATE_FILE = os.path.join(os.path.dirname(__file__), "paper_state.json")

DEFAULT_STATE = {
    "cash": 1000000.0,  # 10 Lakh INR Starting Balance
    "initial_capital": 1000000.0,
    "positions": {},     # symbol -> {qty, avg_price, current_price, pnl, pnl_pct, stop_loss, target, side, entry_time}
    "closed_trades": [], # list of {symbol, side, qty, entry_price, exit_price, pnl, pnl_pct, reason, timestamp}
    "orders": [],        # history of placed orders
    "stats": {
        "total_trades": 0,
        "winning_trades": 0,
        "losing_trades": 0,
        "win_rate": 0.0,
        "total_pnl": 0.0,
        "total_pnl_pct": 0.0,
        "max_drawdown": 0.0,
        "profit_factor": 1.0
    }
}

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return DEFAULT_STATE.copy()
    return DEFAULT_STATE.copy()

def save_state(state):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print("Error saving paper state:", e)

def get_paper_summary(current_prices=None):
    state = load_state()
    total_position_val = 0.0
    unrealized_pnl = 0.0

    current_prices = current_prices or {}

    for sym, pos in list(state["positions"].items()):
        cur_price = current_prices.get(sym, pos.get("current_price", pos["avg_price"]))
        pos["current_price"] = cur_price
        
        qty = pos["qty"]
        avg = pos["avg_price"]
        side = pos.get("side", "BUY")

        if side == "BUY":
            pnl = (cur_price - avg) * qty
            pnl_pct = ((cur_price - avg) / avg) * 100 if avg else 0
        else: # SHORT
            pnl = (avg - cur_price) * qty
            pnl_pct = ((avg - cur_price) / avg) * 100 if avg else 0

        pos["pnl"] = round(pnl, 2)
        pos["pnl_pct"] = round(pnl_pct, 2)
        total_position_val += cur_price * qty
        unrealized_pnl += pnl

    total_portfolio_val = state["cash"] + total_position_val
    total_pnl = total_portfolio_val - state["initial_capital"]
    total_pnl_pct = (total_pnl / state["initial_capital"]) * 100

    # recalculate stats
    closed = state.get("closed_trades", [])
    wins = [t for t in closed if t.get("pnl", 0) > 0]
    losses = [t for t in closed if t.get("pnl", 0) < 0]
    total_wins = sum(t.get("pnl", 0) for t in wins)
    total_loss = abs(sum(t.get("pnl", 0) for t in losses))

    win_rate = (len(wins) / len(closed) * 100) if closed else 0.0
    profit_factor = round(total_wins / total_loss, 2) if total_loss > 0 else (round(total_wins, 2) if total_wins > 0 else 1.0)

    state["stats"] = {
        "total_trades": len(closed),
        "winning_trades": len(wins),
        "losing_trades": len(losses),
        "win_rate": round(win_rate, 1),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "unrealized_pnl": round(unrealized_pnl, 2),
        "realized_pnl": round(sum(t.get("pnl", 0) for t in closed), 2),
        "portfolio_value": round(total_portfolio_val, 2),
        "cash_balance": round(state["cash"], 2),
        "profit_factor": profit_factor
    }

    save_state(state)
    return state

def execute_order(symbol, side, qty, price, stop_loss=None, target=None, algo_name="Manual Order"):
    state = load_state()
    price = float(price)
    qty = int(qty)
    cost = price * qty

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if side == "BUY":
        if cost > state["cash"]:
            return {"success": False, "error": f"Insufficient funds. Required ₹{cost:,.2f}, Available ₹{state['cash']:,.2f}"}
        
        state["cash"] -= cost
        if symbol in state["positions"]:
            pos = state["positions"][symbol]
            new_qty = pos["qty"] + qty
            pos["avg_price"] = round(((pos["avg_price"] * pos["qty"]) + (price * qty)) / new_qty, 2)
            pos["qty"] = new_qty
            if stop_loss: pos["stop_loss"] = stop_loss
            if target: pos["target"] = target
        else:
            state["positions"][symbol] = {
                "symbol": symbol,
                "qty": qty,
                "avg_price": price,
                "current_price": price,
                "pnl": 0.0,
                "pnl_pct": 0.0,
                "side": "BUY",
                "stop_loss": stop_loss,
                "target": target,
                "algo_name": algo_name,
                "entry_time": timestamp
            }
    elif side == "SELL":
        if symbol not in state["positions"] or state["positions"][symbol]["qty"] < qty:
            return {"success": False, "error": "Insufficient quantity to sell."}

        pos = state["positions"][symbol]
        avg_entry = pos["avg_price"]
        pnl = (price - avg_entry) * qty
        pnl_pct = ((price - avg_entry) / avg_entry) * 100

        state["cash"] += price * qty
        pos["qty"] -= qty

        # record closed trade
        state["closed_trades"].insert(0, {
            "symbol": symbol,
            "side": "BUY_TO_SELL",
            "qty": qty,
            "entry_price": avg_entry,
            "exit_price": price,
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "algo_name": pos.get("algo_name", algo_name),
            "entry_time": pos.get("entry_time", timestamp),
            "exit_time": timestamp
        })

        if pos["qty"] <= 0:
            del state["positions"][symbol]

    order_record = {
        "id": f"ORD-{int(time.time()*1000)}",
        "symbol": symbol,
        "side": side,
        "qty": qty,
        "price": price,
        "value": round(cost, 2),
        "algo_name": algo_name,
        "timestamp": timestamp,
        "status": "EXECUTED"
    }
    state["orders"].insert(0, order_record)
    save_state(state)
    return {"success": True, "order": order_record, "state": get_paper_summary({symbol: price})}

def auto_paper_trade_signals(signals_list, current_prices):
    """
    Simulates high-conviction automated execution on algorithmic signals.
    Enforces risk guardrails (Max 3 open trades, risk 2% per trade).
    """
    state = load_state()
    executed = []

    # Check existing positions for Target or SL hits
    for sym, pos in list(state["positions"].items()):
        cur_price = current_prices.get(sym)
        if not cur_price:
            continue
        
        sl = pos.get("stop_loss")
        tp = pos.get("target")

        # Stop loss check
        if sl and cur_price <= sl:
            res = execute_order(sym, "SELL", pos["qty"], cur_price, algo_name=f"SL Triggered ({pos.get('algo_name','Algo')})")
            executed.append({"action": "STOP_LOSS", "symbol": sym, "price": cur_price, "pnl": res.get("state",{}).get("closed_trades",[{}])[0].get("pnl")})
        # Target check
        elif tp and cur_price >= tp:
            res = execute_order(sym, "SELL", pos["qty"], cur_price, algo_name=f"Target Hit ({pos.get('algo_name','Algo')})")
            executed.append({"action": "TARGET_PROFIT", "symbol": sym, "price": cur_price, "pnl": res.get("state",{}).get("closed_trades",[{}])[0].get("pnl")})

    # Position screening: Max 5 concurrent positions
    if len(state["positions"]) >= 5:
        return executed

    for sig in signals_list:
        sym = sig.get("symbol")
        rec_signal = sig.get("signal")
        conf = sig.get("confidence", 0)
        overall = sig.get("overall", 0)
        cur_price = current_prices.get(sym)

        if not cur_price or sym in state["positions"]:
            continue

        # Execute only top-tier confirmed signals
        if rec_signal == "buy" and (conf >= 75 or overall >= 80):
            # Allocation: 10% of cash
            budget = state["cash"] * 0.10
            qty = int(budget // cur_price)
            if qty > 0:
                sl = sig.get("stop_loss") or round(cur_price * 0.98, 2)
                tp = (sig.get("targets") or [round(cur_price * 1.04, 2)])[0]
                algo_label = sig.get("algo_detected") or "Multi-Agent Consensus Alpha"
                order_res = execute_order(sym, "BUY", qty, cur_price, stop_loss=sl, target=tp, algo_name=algo_label)
                if order_res.get("success"):
                    executed.append({"action": "NEW_BUY", "symbol": sym, "price": cur_price, "qty": qty, "algo": algo_label})
                    if len(state["positions"]) >= 5:
                        break

    return executed

def reset_paper_account():
    save_state(DEFAULT_STATE.copy())
    return DEFAULT_STATE.copy()
