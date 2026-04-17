"""
weather_check.py  -  Gig Worker Insurance: Unfavourable Weather Verification
------------------------------------------------------------------------------
Called ONLY when Crosscheck-ip.py returns a fraud score < 4.
Reads OWM_API_KEY from .env file in the same directory.
Uses the OpenWeatherMap Current Weather Data API.

Unfavourable weather is declared when ANY of the following is true:
    - Precipitation group: Thunderstorm / Drizzle / Rain / Snow
      (OWM condition IDs: 200-531, 600-622)
    - Extreme atmospheric events: Tornado, Squall
      (OWM condition IDs: 781, 771)
    - Temperature >= 38 C (extreme heat)
    - Wind speed >= 20 m/s (~72 km/h, storm-force)

OUTPUT  : "yes" (weather is unfavourable, claim supported)
          "no"  (weather is acceptable, claim not supported)  on stdout.
STORAGE : Full record appended to weather_log.json.

Usage:
    python weather_check.py <latitude> <longitude>
"""

import sys
import json
import os
import requests
from datetime import datetime, timezone

# ── Load .env ─────────────────────────────────────────────────────────────────
def load_env(env_path: str) -> dict:
    env = {}
    if not os.path.exists(env_path):
        return env
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            env[key.strip()] = val.strip()
    return env


BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
_env        = load_env(os.path.join(BASE_DIR, ".env"))
OWM_API_KEY = _env.get("OWM_API_KEY") or os.environ.get("OWM_API_KEY", "")

WEATHER_LOG_FILE = os.path.join(BASE_DIR, "weather_log.json")
OWM_WEATHER_URL  = "https://api.openweathermap.org/data/2.5/weather"

# ── Unfavourable condition rules ──────────────────────────────────────────────
# OWM condition ID ranges that represent unfavourable weather for outdoor gig work
UNFAVOURABLE_ID_RANGES = [
    (200, 232),   # Thunderstorm
    (300, 321),   # Drizzle
    (500, 531),   # Rain
    (600, 622),   # Snow / sleet
    (771, 771),   # Squall
    (781, 781),   # Tornado
]

TEMP_THRESHOLD_C  = 38.0   # Celsius - extreme heat
WIND_THRESHOLD_MS = 20.0   # m/s - storm-force (72 km/h)


# ── Helpers ───────────────────────────────────────────────────────────────────
def fetch_weather(lat: float, lon: float) -> dict:
    params = {
        "lat":   lat,
        "lon":   lon,
        "appid": OWM_API_KEY,
        "units": "metric",   # Celsius
    }
    r = requests.get(OWM_WEATHER_URL, params=params, timeout=10)
    r.raise_for_status()
    return r.json()


def is_precipitation_id(cond_id: int) -> bool:
    return any(lo <= cond_id <= hi for lo, hi in UNFAVOURABLE_ID_RANGES)


def evaluate(data: dict) -> tuple[bool, list[str]]:
    """
    Returns (unfavourable: bool, triggered_reasons: list[str])
    """
    reasons = []

    weather_list = data.get("weather", [])
    for w in weather_list:
        cid   = w.get("id", 0)
        label = w.get("description", "unknown")
        if is_precipitation_id(cid):
            reasons.append(f"Precipitation/severe weather: {label} (code {cid})")

    temp      = data.get("main", {}).get("temp")
    wind_spd  = data.get("wind", {}).get("speed")

    if temp is not None and temp >= TEMP_THRESHOLD_C:
        reasons.append(f"Extreme heat: {temp:.1f} C (threshold {TEMP_THRESHOLD_C} C)")

    if wind_spd is not None and wind_spd >= WIND_THRESHOLD_MS:
        reasons.append(f"Storm-force wind: {wind_spd:.1f} m/s (threshold {WIND_THRESHOLD_MS} m/s)")

    return len(reasons) > 0, reasons


def append_log(record: dict) -> None:
    log = []
    if os.path.exists(WEATHER_LOG_FILE) and os.path.getsize(WEATHER_LOG_FILE) > 0:
        try:
            with open(WEATHER_LOG_FILE) as f:
                log = json.load(f)
        except json.JSONDecodeError:
            pass
    log.append(record)
    with open(WEATHER_LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)


# ── Core ──────────────────────────────────────────────────────────────────────
def run(lat: float, lon: float) -> str:
    if not OWM_API_KEY or OWM_API_KEY == "your_openweathermap_api_key_here":
        print("[ERROR] OWM_API_KEY not set in .env", file=sys.stderr)
        sys.exit(1)

    print(f"[WEATHER] Fetching current conditions for ({lat}, {lon})", file=sys.stderr)

    try:
        data = fetch_weather(lat, lon)
    except Exception as e:
        print(f"[ERROR] Weather API request failed: {e}", file=sys.stderr)
        sys.exit(1)

    weather_desc = data.get("weather", [{}])[0].get("description", "unknown")
    temp         = data.get("main", {}).get("temp")
    wind_spd     = data.get("wind", {}).get("speed")
    humidity     = data.get("main", {}).get("humidity")
    city_name    = data.get("name", "unknown")

    print(f"[WEATHER] Location: {city_name}", file=sys.stderr)
    print(f"[WEATHER] Conditions: {weather_desc} | Temp: {temp} C | Wind: {wind_spd} m/s | Humidity: {humidity}%", file=sys.stderr)

    unfavourable, reasons = evaluate(data)
    answer = "yes" if unfavourable else "no"

    if unfavourable:
        print("[WEATHER] UNFAVOURABLE - claim SUPPORTED", file=sys.stderr)
        for r in reasons:
            print(f"  - {r}", file=sys.stderr)
    else:
        print("[WEATHER] Conditions acceptable - claim NOT supported by weather data", file=sys.stderr)

    append_log({
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        "coords":          {"lat": lat, "lon": lon},
        "city":            city_name,
        "description":     weather_desc,
        "temp_c":          temp,
        "wind_ms":         wind_spd,
        "humidity_pct":    humidity,
        "unfavourable":    unfavourable,
        "reasons":         reasons,
        "claim_supported": unfavourable,
        "result":          answer,
    })

    # stdout: only "yes" or "no"
    print(answer)
    return answer


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python weather_check.py <latitude> <longitude>", file=sys.stderr)
        sys.exit(1)
    try:
        b_lat = float(sys.argv[1])
        b_lon = float(sys.argv[2])
    except ValueError:
        print("ERROR: lat/lon must be numeric", file=sys.stderr)
        sys.exit(1)

    run(b_lat, b_lon)
