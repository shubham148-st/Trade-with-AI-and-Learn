"""
Single File Execution Script for the Entire Quant & Paper Trading Simulation
- Launches Flask Backend (Port 5500)
- Launches React Frontend with Vite (Port 5173)
- Waits for services to become healthy
- Opens the React Web App in the default browser
- Runs an instant automated end-to-end paper trading cycle
- Handles graceful shutdown on Ctrl+C
"""

import sys
import os
import subprocess
import time
import webbrowser
import urllib.request
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "nse-dashboard")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

BACKEND_URL = "http://127.0.0.1:5500"
FRONTEND_URL = "http://127.0.0.1:5173"

processes = []

def log(msg, symbol="*"):
    print(f"[{symbol}] {msg}")

def check_service_ready(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.urlopen(url, timeout=2)
            if req.getcode() in (200, 304):
                return True
        except Exception:
            time.sleep(1)
    return False

def run_automated_sim_cycle():
    """Triggers pre-market multi-agent discovery and executes top algo trades on the virtual balance."""
    log("Running automated end-to-end multi-agent simulation cycle...", "AI")
    try:
        # 1. Trigger scan
        log("Executing parallel discovery across 30+ NSE stocks (News NLP + Historical + Strategy)...", "SCAN")
        req = urllib.request.Request(f"{BACKEND_URL}/api/analysis/scan")
        with urllib.request.urlopen(req, timeout=40) as response:
            ranked = json.loads(response.read().decode())
        
        top_candidates = ranked[:3]
        log(f"Screened {len(ranked)} stocks. Top 3 Institutional Alpha Candidates:", "TOP")
        for i, c in enumerate(top_candidates, 1):
            log(f"   #{i} {c['symbol'].replace('.NS','')} -- Score: {c['overall']}/100 | Signal: {c['signal'].upper()} ({c['confidence']}%) | Trend: {c['trend']}")

        # 2. Trigger auto paper execution
        log("Executing High-Conviction Algorithmic Orders into Paper Portfolio...", "TRADE")
        post_data = json.dumps({"signals": ranked}).encode('utf-8')
        req = urllib.request.Request(
            f"{BACKEND_URL}/api/paper/auto_execute",
            data=post_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            auto_res = json.loads(response.read().decode())

        executed = auto_res.get("executed", [])
        if executed:
            log(f"Successfully placed {len(executed)} trades with strict SL & TP guardrails:", "OK")
            for t in executed:
                log(f"   -> {t.get('action')}: {t.get('symbol')} at Rs.{t.get('price')} (Strategy: {t.get('algo')})")
        else:
            log("Risk guardrails maintained: existing positions held, capital limits protected.", "RISK")

        # 3. Print current paper P&L
        stats = auto_res.get("summary", {}).get("stats", {})
        log("---------------------------------------------------", "=")
        log(f"Portfolio Value : Rs.{stats.get('portfolio_value', 1000000):,.2f}")
        log(f"Net P&L         : Rs.{stats.get('total_pnl', 0):,.2f} ({stats.get('total_pnl_pct', 0):+.2f}%)")
        log(f"Win Rate        : {stats.get('win_rate', 0)}%")
        log("---------------------------------------------------", "=")

    except Exception as e:
        log(f"Simulation cycle note: {e}", "!")

def cleanup():
    log("Terminating background simulation servers...", "STOP")
    for p in processes:
        try:
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        except Exception:
            pass
    log("All processes safely stopped.", "EXIT")

def main():
    print("=======================================================================")
    print("  NSE QUANTPRO - ALL-IN-ONE SIMULATION & TRADING RUNNER")
    print("=======================================================================")
    print("  * Backend: Flask API + yfinance Streaming Engine (Port 5500)")
    print("  * Frontend: React 19 + Vite Modern Web UI (Port 5173)")
    print("  * Paper Trading: 10 Lakh Virtual Capital + Auto Risk Guardrails")
    print("=======================================================================")

    # 1. Start Flask Backend
    log("Starting Flask Quant & Streaming Engine on port 5500...", "INIT")
    app_py = os.path.join(BACKEND_DIR, "app.py")
    flask_proc = subprocess.Popen(
        [sys.executable, app_py],
        cwd=BACKEND_DIR
    )
    processes.append(flask_proc)

    # 2. Start Vite Frontend
    log("Starting React Vite Web Application on port 5173...", "INIT")
    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    vite_proc = subprocess.Popen(
        [npx_cmd, "vite", "--port", "5173", "--host", "127.0.0.1"],
        cwd=FRONTEND_DIR
    )
    processes.append(vite_proc)

    # 3. Wait for services to be ready
    log("Waiting for backend API to initialize...", "WAIT")
    if check_service_ready(f"{BACKEND_URL}/api/batch_quotes", timeout=30):
        log("Flask Backend is LIVE and healthy on http://127.0.0.1:5500", "OK")
    else:
        log("Backend warning: API took longer than expected to report ready.", "WARN")

    log("Waiting for React Vite server...", "WAIT")
    if check_service_ready(FRONTEND_URL, timeout=20):
        log("React Frontend is LIVE on http://127.0.0.1:5173", "OK")
    else:
        log("Frontend warning: Vite took longer to initialize.", "WARN")

    # 4. Run automated sim cycle
    run_automated_sim_cycle()

    # 5. Open browser
    log("Opening React Web App in your browser...", "WEB")
    try:
        webbrowser.open(FRONTEND_URL)
    except Exception:
        pass

    print("-----------------------------------------------------------------------")
    print("  All systems active!")
    print("  -> Open http://localhost:5173 to interact with the full UI.")
    print("  -> Press Ctrl + C anytime in this terminal to shut down all servers.")
    print("-----------------------------------------------------------------------")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
