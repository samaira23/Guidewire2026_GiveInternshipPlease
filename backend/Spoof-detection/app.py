"""
app.py  -  GigGuard Flask Server
---------------------------------
Serves the HTML frontend and exposes three API endpoints that wire
the browser button directly to the Python verification pipeline.

Endpoints:
    GET  /                  -> HTML page
    POST /api/crosscheck    -> {lat, lon} -> {score, band, reasons, ip}
    POST /api/air-quality   -> {lat, lon} -> {result: "yes"/"no", ...}
    POST /api/weather       -> {lat, lon} -> {result: "yes"/"no", ...}

Run:
    python app.py
Then open: http://localhost:5000
"""

import os
import sys
import importlib.util
from flask import Flask, request, jsonify, render_template

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ── Module loader (handles hyphen in Crosscheck-ip.py) ────────────────────────
def _load(filename: str):
    path = os.path.join(BASE_DIR, filename)
    name = filename.replace(".py", "").replace("-", "_")
    spec = importlib.util.spec_from_file_location(name, path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


crosscheck_mod  = _load("Crosscheck-ip.py")
air_quality_mod = _load("air_quality_check.py")
weather_mod     = _load("weather_check.py")

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__, template_folder="templates")


@app.route("/")
def index():
    return render_template("index.html")


# ── /api/crosscheck ───────────────────────────────────────────────────────────
@app.route("/api/crosscheck", methods=["POST"])
def api_crosscheck():
    body = request.get_json(silent=True) or {}
    try:
        lat = float(body["lat"])
        lon = float(body["lon"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "lat and lon are required numeric fields"}), 400

    try:
        result = crosscheck_mod.compute_score(lat, lon)
        return jsonify({
            "score":   result["fraud_score"],
            "band":    result["band"],
            "reasons": result["reasons"],
            "ip":      result.get("ip", "unknown"),
        })
    except SystemExit:
        return jsonify({"error": "IP discovery failed — check network connection"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── /api/air-quality ──────────────────────────────────────────────────────────
@app.route("/api/air-quality", methods=["POST"])
def api_air_quality():
    body = request.get_json(silent=True) or {}
    try:
        lat = float(body["lat"])
        lon = float(body["lon"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "lat and lon are required"}), 400

    try:
        answer = air_quality_mod.run(lat, lon)
        return jsonify({"result": answer})
    except SystemExit:
        return jsonify({"error": "OWM_API_KEY missing or invalid — check .env"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── /api/weather ──────────────────────────────────────────────────────────────
@app.route("/api/weather", methods=["POST"])
def api_weather():
    body = request.get_json(silent=True) or {}
    try:
        lat = float(body["lat"])
        lon = float(body["lon"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "lat and lon are required"}), 400

    try:
        answer = weather_mod.run(lat, lon)
        return jsonify({"result": answer})
    except SystemExit:
        return jsonify({"error": "OWM_API_KEY missing or invalid — check .env"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n GigGuard running at http://localhost:5000\n")
    app.run(debug=True, port=5000)
