"""
Paper Trading Simulation Engine
Maintains in-memory and persistent virtual balances, orders, positions, and logs.
Realistic execution matching modern brokers (Zerodha / Groww style):
- Order Types: MARKET, LIMIT, SL (Stop Loss Limit), SL-M (Stop Loss Market), GTT (Good Till Triggered)
- Product Types: CNC (Cash & Carry), INTRADAY (MIS)
- Realistic Brokerage & Regulatory Charges (0.03% or ₹20 cap + STT + GST)
- Pending Orders Matching Engine
- Agent Guardrails & Strategy Source Traceability
- Time Machine Historical Date Simulation (Read-Only)
"""

import time
import json
import os
from datetime import datetime
import yfinance as yf

STATE_FILE = os.path.join(os.path.dirname(__file__), "paper_state.json")

DEFAULT_AGENT_CONFIG = {
    "auto_trade_enabled": False,           # OFF by default
    "allowed_strategies": ["PRE_MARKET", "LIVE_ALGO", "POST_MARKET", "LEARNER_AGENT"],
    "max_capital_allocation": 500000.0,    # Max cash the agent can allocate in total
    "max_allocation_per_trade_pct": 10.0,  # Max 10% per trade
    "max_open_positions": 5,
    "default_stop_loss_pct": 2.0,
    "default_target_pct": 4.0,
    "min_confidence_score": 75,
    "symbol_whitelist": []                 # Empty means all eligible symbols allowed
}

DEFAULT_STATE = {
    "cash": 1000000.0,          # 10 Lakh INR Starting Balance
    "initial_capital": 1000000.0,
    "total_charges_paid": 0.0,   # Cumulative brokerage, STT & taxes
    "positions": {},             # symbol -> {qty, avg_price, current_price, pnl, pnl_pct, stop_loss, target, side, product_type, strategy_source, entry_time}
    "pending_orders": [],        # list of pending limit/SL/GTT orders
    "closed_trades": [],         # list of closed trade executions
    "orders": [],                # history of all placed/executed/cancelled orders
    "equity_curve": [],          # [{timestamp, portfolio_value, cash, realized_pnl}]
    "agent_config": DEFAULT_AGENT_CONFIG,
    "stats": {
        "total_trades": 0,
        "winning_trades": 0,
        "losing_trades": 0,
        "win_rate": 0.0,
        "total_pnl": 0.0,
        "total_pnl_pct": 0.0,
        "max_drawdown": 0.0,
        "profit_factor": 1.0,
        "total_charges": 0.0
    }
}


def calculate_brokerage_and_charges(price, qty, side, product_type="CNC"):
    """
    Calculates realistic broker charges modeled after Zerodha/Groww:
    - Brokerage: 0.03% of turnover or ₹20 (whichever is lower) for Intraday/F&O; ₹0 or 0.03% (cap ₹20)
    - STT: 0.1% on buy & sell for Delivery (CNC), 0.025% on sell for Intraday
    - Exchange Txn Charge: 0.00345% of turnover
    - GST: 18% on (Brokerage + Txn charge)
    - Stamp Duty: 0.015% on buy turnover
    """
    turnover = float(price) * int(qty)
    if turnover <= 0:
        return {"brokerage": 0.0, "stt": 0.0, "other_taxes": 0.0, "total_charges": 0.0}

    # Brokerage: min(turnover * 0.0003, 20.0)
    brokerage = min(turnover * 0.0003, 20.0)

    # STT
    if product_type == "INTRADAY":
        stt = (turnover * 0.00025) if side == "SELL" else 0.0
    else: # CNC Delivery
        stt = turnover * 0.001 if side == "SELL" else 0.0

    # Exchange transaction charge (~0.00345%)
    txn_charge = turnover * 0.0000345

    # GST 18% on brokerage + txn charge
    gst = (brokerage + txn_charge) * 0.18

    # Stamp duty: buy side only (~0.015%)
    stamp_duty = (turnover * 0.00015) if side == "BUY" else 0.0

    other_taxes = txn_charge + gst + stamp_duty
    total_charges = round(brokerage + stt + other_taxes, 2)

    return {
        "brokerage": round(brokerage, 2),
        "stt": round(stt, 2),
        "other_taxes": round(other_taxes, 2),
        "total_charges": total_charges
    }


def load_state():
    state = DEFAULT_STATE.copy()
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                saved = json.load(f)
                if isinstance(saved, dict):
                    state.update(saved)
                    # Merge agent config defaults
                    cfg = DEFAULT_AGENT_CONFIG.copy()
                    if "agent_config" in saved and isinstance(saved["agent_config"], dict):
                        cfg.update(saved["agent_config"])
                    state["agent_config"] = cfg
                    if "pending_orders" not in state:
                        state["pending_orders"] = []
                    if "equity_curve" not in state:
                        state["equity_curve"] = []
                    if "total_charges_paid" not in state:
                        state["total_charges_paid"] = 0.0
        except Exception as e:
            print(f"Error loading paper state: {e}")
    return state


def save_state(state):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print("Error saving paper state:", e)


def get_agent_config():
    state = load_state()
    return state.get("agent_config", DEFAULT_AGENT_CONFIG.copy())


def update_agent_config(new_config):
    state = load_state()
    current_config = state.get("agent_config", DEFAULT_AGENT_CONFIG.copy())
    current_config.update(new_config)
    state["agent_config"] = current_config
    save_state(state)
    return current_config


def check_pending_orders(current_prices=None):
    """
    Scans pending orders against current prices to execute triggered Limit, SL, or GTT orders.
    """
    state = load_state()
    pending = state.get("pending_orders", [])
    if not pending or not current_prices:
        return []

    executed_orders = []
    remaining_pending = []
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for order in pending:
        sym = order.get("symbol")
        cur_price = current_prices.get(sym)
        if not cur_price:
            remaining_pending.append(order)
            continue

        cur_price = float(cur_price)
        order_type = order.get("order_type", "LIMIT").upper()
        side = order.get("side", "BUY").upper()
        target_price = float(order.get("price", cur_price))
        trigger_price = float(order.get("trigger_price", target_price))
        qty = int(order.get("qty", 1))

        triggered = False
        exec_price = cur_price

        if order_type == "LIMIT":
            if side == "BUY" and cur_price <= target_price:
                triggered = True
                exec_price = min(cur_price, target_price)
            elif side == "SELL" and cur_price >= target_price:
                triggered = True
                exec_price = max(cur_price, target_price)

        elif order_type in ("SL", "SL-M"):
            # Stop loss order triggers when price hits or crosses trigger_price
            if side == "SELL" and cur_price <= trigger_price:
                triggered = True
                exec_price = trigger_price if order_type == "SL-M" else target_price
            elif side == "BUY" and cur_price >= trigger_price:
                triggered = True
                exec_price = trigger_price if order_type == "SL-M" else target_price

        elif order_type == "GTT":
            # GTT triggers when trigger_price is breached
            if side == "BUY" and cur_price <= trigger_price:
                triggered = True
                exec_price = cur_price
            elif side == "SELL" and cur_price >= trigger_price:
                triggered = True
                exec_price = cur_price

        if triggered:
            # Execute the order
            res = _execute_fill(state, sym, side, qty, exec_price,
                                stop_loss=order.get("stop_loss"),
                                target=order.get("target"),
                                algo_name=f"Pending {order_type} Fill ({order.get('algo_name', 'Manual')})",
                                product_type=order.get("product_type", "CNC"),
                                strategy_source=order.get("strategy_source", "MANUAL"),
                                order_type=order_type)
            if res.get("success"):
                order["status"] = "FILLED"
                order["filled_at"] = timestamp
                order["fill_price"] = exec_price
                executed_orders.append(order)
            else:
                order["status"] = "REJECTED"
                order["rejection_reason"] = res.get("error", "Execution failed")
                executed_orders.append(order)
        else:
            remaining_pending.append(order)

    state["pending_orders"] = remaining_pending
    save_state(state)
    return executed_orders


def get_paper_summary(current_prices=None):
    state = load_state()
    current_prices = current_prices or {}

    # Check pending orders with current prices if available
    if current_prices:
        check_pending_orders(current_prices)
        state = load_state()

    total_position_val = 0.0
    unrealized_pnl = 0.0

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

    # Record equity curve snapshot (up to 300 points)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    equity_curve = state.get("equity_curve", [])
    if not equity_curve or (equity_curve and equity_curve[-1].get("timestamp") != now_str):
        equity_curve.append({
            "timestamp": now_str,
            "portfolio_value": round(total_portfolio_val, 2),
            "cash": round(state["cash"], 2),
            "pnl": round(total_pnl, 2)
        })
        if len(equity_curve) > 300:
            equity_curve = equity_curve[-300:]
        state["equity_curve"] = equity_curve

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
        "profit_factor": profit_factor,
        "total_charges": round(state.get("total_charges_paid", 0.0), 2)
    }

    save_state(state)
    return state


def _execute_fill(state, symbol, side, qty, price, stop_loss=None, target=None, algo_name="Manual Order",
                   product_type="CNC", strategy_source="MANUAL", order_type="MARKET"):
    """Internal helper to fill an executed order and calculate brokerage."""
    price = float(price)
    qty = int(qty)
    cost = price * qty
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    charges = calculate_brokerage_and_charges(price, qty, side, product_type)
    total_fee = charges["total_charges"]

    if side == "BUY":
        required_funds = cost + total_fee
        if required_funds > state["cash"]:
            return {"success": False, "error": f"Insufficient funds. Required ₹{required_funds:,.2f}, Available ₹{state['cash']:,.2f}"}

        state["cash"] -= required_funds
        state["total_charges_paid"] = round(state.get("total_charges_paid", 0.0) + total_fee, 2)

        if symbol in state["positions"]:
            pos = state["positions"][symbol]
            new_qty = pos["qty"] + qty
            pos["avg_price"] = round(((pos["avg_price"] * pos["qty"]) + (price * qty)) / new_qty, 2)
            pos["qty"] = new_qty
            if stop_loss: pos["stop_loss"] = stop_loss
            if target: pos["target"] = target
            pos["total_fees"] = round(pos.get("total_fees", 0.0) + total_fee, 2)
        else:
            state["positions"][symbol] = {
                "symbol": symbol,
                "qty": qty,
                "avg_price": price,
                "current_price": price,
                "pnl": 0.0,
                "pnl_pct": 0.0,
                "side": "BUY",
                "product_type": product_type,
                "stop_loss": stop_loss,
                "target": target,
                "algo_name": algo_name,
                "strategy_source": strategy_source,
                "entry_time": timestamp,
                "total_fees": total_fee
            }
    elif side == "SELL":
        if symbol not in state["positions"] or state["positions"][symbol]["qty"] < qty:
            return {"success": False, "error": f"Insufficient holdings in {symbol} to sell {qty} units."}

        pos = state["positions"][symbol]
        avg_entry = pos["avg_price"]
        gross_pnl = (price - avg_entry) * qty
        net_pnl = gross_pnl - total_fee - pos.get("total_fees", 0.0)
        pnl_pct = ((price - avg_entry) / avg_entry) * 100 if avg_entry else 0.0

        net_proceeds = (price * qty) - total_fee
        state["cash"] += net_proceeds
        state["total_charges_paid"] = round(state.get("total_charges_paid", 0.0) + total_fee, 2)
        pos["qty"] -= qty

        # Check strategy divergence: if executed source is outside allowed strategies
        cfg = state.get("agent_config", DEFAULT_AGENT_CONFIG)
        allowed = cfg.get("allowed_strategies", [])
        has_divergence = strategy_source not in allowed and strategy_source != "MANUAL"

        # Record closed trade
        state["closed_trades"].insert(0, {
            "symbol": symbol,
            "side": "BUY_TO_SELL",
            "qty": qty,
            "entry_price": avg_entry,
            "exit_price": price,
            "gross_pnl": round(gross_pnl, 2),
            "pnl": round(net_pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "fees_paid": round(total_fee + pos.get("total_fees", 0.0), 2),
            "algo_name": pos.get("algo_name", algo_name),
            "strategy_source": pos.get("strategy_source", strategy_source),
            "divergence": has_divergence,
            "product_type": product_type,
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
        "charges": charges,
        "order_type": order_type,
        "product_type": product_type,
        "algo_name": algo_name,
        "strategy_source": strategy_source,
        "timestamp": timestamp,
        "status": "EXECUTED"
    }
    state["orders"].insert(0, order_record)
    return {"success": True, "order": order_record}


def execute_order(symbol, side, qty, price, stop_loss=None, target=None, algo_name="Manual Order",
                  order_type="MARKET", trigger_price=None, product_type="CNC", strategy_source="MANUAL"):
    """
    Places an order. Supports MARKET, LIMIT, SL, SL-M, and GTT order types.
    Immediate MARKET orders are filled right away.
    Non-market orders are placed in `pending_orders`.
    """
    state = load_state()
    price = float(price) if price else 0.0
    qty = int(qty)
    order_type = order_type.upper()
    side = side.upper()
    product_type = product_type.upper()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # If it's a non-market order, append to pending_orders
    if order_type in ("LIMIT", "SL", "SL-M", "GTT"):
        pending_order = {
            "id": f"PND-{int(time.time()*1000)}",
            "symbol": symbol,
            "side": side,
            "qty": qty,
            "price": price,
            "trigger_price": float(trigger_price) if trigger_price else price,
            "order_type": order_type,
            "product_type": product_type,
            "stop_loss": float(stop_loss) if stop_loss else None,
            "target": float(target) if target else None,
            "algo_name": algo_name,
            "strategy_source": strategy_source,
            "timestamp": timestamp,
            "status": "PENDING"
        }
        state["pending_orders"].insert(0, pending_order)
        state["orders"].insert(0, pending_order)
        save_state(state)
        return {"success": True, "status": "PENDING", "order": pending_order, "state": get_paper_summary()}

    # Otherwise execute MARKET order directly
    res = _execute_fill(state, symbol, side, qty, price, stop_loss, target, algo_name,
                         product_type, strategy_source, order_type)
    if res.get("success"):
        save_state(state)
        return {"success": True, "order": res["order"], "state": get_paper_summary({symbol: price})}
    else:
        return res


def cancel_pending_order(order_id):
    """Cancels a pending limit or SL order by ID."""
    state = load_state()
    pending = state.get("pending_orders", [])
    found = None
    remaining = []

    for o in pending:
        if o.get("id") == order_id:
            found = o
            o["status"] = "CANCELLED"
            o["cancelled_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        else:
            remaining.append(o)

    if found:
        state["pending_orders"] = remaining
        # Also mark cancelled in orders history
        for ord_rec in state.get("orders", []):
            if ord_rec.get("id") == order_id:
                ord_rec["status"] = "CANCELLED"
        save_state(state)
        return {"success": True, "cancelled_order": found}
    return {"success": False, "error": f"Pending order {order_id} not found."}


def auto_paper_trade_signals(signals_list, current_prices):
    """
    Automated execution engine driven by the AI Agent.
    Strictly adheres to user agent settings:
    - Only runs if agent_config.auto_trade_enabled == True
    - Enforces allowed strategy sources, max open positions, capital limit, min confidence
    - Detects and flags any strategy divergences
    """
    state = load_state()
    cfg = state.get("agent_config", DEFAULT_AGENT_CONFIG)

    # 1. Guardrail: If auto_trade_enabled is False, do not execute new positions
    if not cfg.get("auto_trade_enabled", False):
        return {
            "executed": [],
            "status": "DISABLED",
            "message": "AI Auto-Trade is currently disabled in Agent Settings. Enable it via the settings modal to automate execution."
        }

    executed = []
    allowed_sources = cfg.get("allowed_strategies", ["PRE_MARKET", "LIVE_ALGO"])
    max_positions = cfg.get("max_open_positions", 5)
    max_alloc_pct = cfg.get("max_allocation_per_trade_pct", 10.0) / 100.0
    min_confidence = cfg.get("min_confidence_score", 75)
    whitelist = cfg.get("symbol_whitelist", [])

    # First: evaluate existing positions for Stop Loss or Target triggers
    for sym, pos in list(state["positions"].items()):
        cur_price = current_prices.get(sym)
        if not cur_price:
            continue
        cur_price = float(cur_price)

        sl = pos.get("stop_loss")
        tp = pos.get("target")

        # Stop loss check
        if sl and cur_price <= sl:
            res = execute_order(sym, "SELL", pos["qty"], cur_price,
                                algo_name=f"SL Auto-Exit ({pos.get('algo_name','Algo')})",
                                product_type=pos.get("product_type", "CNC"),
                                strategy_source=pos.get("strategy_source", "LIVE_ALGO"))
            if res.get("success"):
                executed.append({"action": "STOP_LOSS", "symbol": sym, "price": cur_price, "reason": "SL Triggered"})

        # Target check
        elif tp and cur_price >= tp:
            res = execute_order(sym, "SELL", pos["qty"], cur_price,
                                algo_name=f"Target Auto-Exit ({pos.get('algo_name','Algo')})",
                                product_type=pos.get("product_type", "CNC"),
                                strategy_source=pos.get("strategy_source", "LIVE_ALGO"))
            if res.get("success"):
                executed.append({"action": "TARGET_PROFIT", "symbol": sym, "price": cur_price, "reason": "Target Hit"})

    # Check capacity limit
    current_pos_count = len(state["positions"])
    if current_pos_count >= max_positions:
        return {"executed": executed, "status": "MAX_POSITIONS_REACHED", "message": f"Reached max positions limit ({max_positions})"}

    # Process new incoming signals
    for sig in signals_list:
        if current_pos_count >= max_positions:
            break

        sym = sig.get("symbol")
        rec_signal = (sig.get("signal") or "").lower()
        conf = sig.get("confidence", 0)
        overall = sig.get("overall", 0)
        source = sig.get("strategy_source", "LIVE_ALGO")
        cur_price = current_prices.get(sym)

        if not cur_price or sym in state["positions"]:
            continue
        cur_price = float(cur_price)

        # Symbol whitelist check
        if whitelist and sym not in whitelist:
            continue

        # Strategy source filter
        if source not in allowed_sources:
            continue

        # Confidence filter
        if rec_signal == "buy" and (conf >= min_confidence or overall >= min_confidence):
            # Allocation check
            alloc_budget = min(state["cash"] * max_alloc_pct, cfg.get("max_capital_allocation", 500000.0))
            qty = int(alloc_budget // cur_price)
            if qty > 0:
                sl_pct = cfg.get("default_stop_loss_pct", 2.0) / 100.0
                tp_pct = cfg.get("default_target_pct", 4.0) / 100.0
                sl = sig.get("stop_loss") or round(cur_price * (1.0 - sl_pct), 2)
                tp = (sig.get("targets") or [round(cur_price * (1.0 + tp_pct), 2)])[0]
                algo_label = sig.get("algo_detected") or f"AI Agent ({source})"

                order_res = execute_order(sym, "BUY", qty, cur_price,
                                          stop_loss=sl, target=tp,
                                          algo_name=algo_label,
                                          product_type="CNC",
                                          strategy_source=source)
                if order_res.get("success"):
                    current_pos_count += 1
                    executed.append({"action": "NEW_BUY", "symbol": sym, "price": cur_price, "qty": qty, "source": source, "algo": algo_label})

    return {"executed": executed, "status": "COMPLETED"}


def simulate_date(target_date_str):
    """
    Time Machine simulation: Evaluates what the current portfolio holdings would have been
    valued at historical close/high/low on `target_date_str` (YYYY-MM-DD).
    Read-only: Does NOT mutate the live portfolio state.
    """
    state = load_state()
    positions = state.get("positions", {})
    if not positions:
        return {
            "success": True,
            "target_date": target_date_str,
            "portfolio_value": round(state["cash"], 2),
            "cash": round(state["cash"], 2),
            "simulated_pnl": 0.0,
            "simulated_pnl_pct": 0.0,
            "positions_simulated": []
        }

    simulated_positions = []
    total_sim_value = state["cash"]

    for sym, pos in positions.items():
        qty = pos.get("qty", 0)
        avg = pos.get("avg_price", 0.0)
        sim_price = avg

        try:
            # Download 5 days around the date to handle weekends / holidays
            hist = yf.Ticker(sym).history(start=target_date_str, period="5d")
            if not hist.empty:
                sim_price = float(hist["Close"].iloc[0])
        except Exception as e:
            print(f"Time Machine historical fetch failed for {sym}: {e}")
            sim_price = avg

        pos_val = sim_price * qty
        total_sim_value += pos_val
        pos_pnl = (sim_price - avg) * qty
        pos_pnl_pct = ((sim_price - avg) / avg * 100) if avg else 0.0

        simulated_positions.append({
            "symbol": sym,
            "qty": qty,
            "avg_price": avg,
            "simulated_price": round(sim_price, 2),
            "simulated_pnl": round(pos_pnl, 2),
            "simulated_pnl_pct": round(pos_pnl_pct, 2)
        })

    sim_total_pnl = total_sim_value - state["initial_capital"]
    sim_pnl_pct = (sim_total_pnl / state["initial_capital"]) * 100

    return {
        "success": True,
        "is_time_machine": True,
        "target_date": target_date_str,
        "portfolio_value": round(total_sim_value, 2),
        "cash": round(state["cash"], 2),
        "simulated_pnl": round(sim_total_pnl, 2),
        "simulated_pnl_pct": round(sim_pnl_pct, 2),
        "positions_simulated": simulated_positions
    }


def reset_paper_account():
    save_state(DEFAULT_STATE.copy())
    return DEFAULT_STATE.copy()
