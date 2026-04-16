

import sys
import json
import os
import requests
from datetime import datetime, timezone

# ── Load .env manually (no extra library needed) ──────────────────────────────
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

AQ_LOG_FILE = os.path.join(BASE_DIR, "air_quality_log.json")
OWM_AIR_URL = "http://api.openweathermap.org/data/2.5/air_pollution"

# WHO 2021 thresholds (ug/m3, 24-hour mean)
LIMITS = {
    "pm2_5": 25.0,
    "pm10":  45.0,
    "no2":   25.0,
    "o3":    100.0,
    "so2":   40.0,
    "co":    4000.0,
}
AQI_MAX_ALLOWED = 2   # 1=Good, 2=Fair -> ok; 3+ -> above permissible
AQI_LABELS      = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}


# ── Helpers ───────────────────────────────────────────────────────────────────
def fetch_air_quality(lat: float, lon: float) -> dict:
    r = requests.get(OWM_AIR_URL, params={"lat": lat, "lon": lon, "appid": OWM_API_KEY}, timeout=10)
    r.raise_for_status()
    return r.json()


def check_breaches(components: dict) -> list[dict]:
    out = []
    for key, limit in LIMITS.items():
        val = components.get(key)
        if val is not None and val >= limit:
            out.append({"pollutant": key.upper(), "measured": round(val, 3), "limit": limit, "unit": "ug/m3"})
    return out


def append_log(record: dict) -> None:
    log = []
    if os.path.exists(AQ_LOG_FILE) and os.path.getsize(AQ_LOG_FILE) > 0:
        try:
            with open(AQ_LOG_FILE) as f:
                log = json.load(f)
        except json.JSONDecodeError:
            pass
    log.append(record)
    with open(AQ_LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)


# ── Core ──────────────────────────────────────────────────────────────────────
def run(lat: float, lon: float) -> str:
    if not OWM_API_KEY or OWM_API_KEY == "your_openweathermap_api_key_here":
        print("[ERROR] OWM_API_KEY not set in .env", file=sys.stderr)
        sys.exit(1)

    print(f"[AIR QUALITY] Fetching for ({lat}, {lon})", file=sys.stderr)

    try:
        data = fetch_air_quality(lat, lon)
    except Exception as e:
        print(f"[ERROR] API request failed: {e}", file=sys.stderr)
        sys.exit(1)

    entry      = data["list"][0]
    aqi        = int(entry["main"]["aqi"])
    components = entry["components"]
    aqi_label  = AQI_LABELS.get(aqi, str(aqi))
    aqi_breach = aqi > AQI_MAX_ALLOWED
    breaches   = check_breaches(components)
    supported  = aqi_breach or len(breaches) > 0
    answer     = "yes" if supported else "no"

    print(f"[AIR QUALITY] AQI={aqi} ({aqi_label})  breaches={breaches}", file=sys.stderr)
    if supported:
        print("[AIR QUALITY] Above permissible limits - claim SUPPORTED", file=sys.stderr)
    else:
        print("[AIR QUALITY] Within normal limits - claim NOT supported", file=sys.stderr)

    append_log({
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        "coords":          {"lat": lat, "lon": lon},
        "aqi":             aqi,
        "aqi_label":       aqi_label,
        "aqi_breach":      aqi_breach,
        "components":      components,
        "breaches":        breaches,
        "claim_supported": supported,
        "result":          answer,
    })

    # stdout: only "yes" or "no"
    print(answer)
    return answer


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python air_quality_check.py <latitude> <longitude>", file=sys.stderr)
        sys.exit(1)
    try:
        b_lat = float(sys.argv[1])
        b_lon = float(sys.argv[2])
    except ValueError:
        print("ERROR: lat/lon must be numeric", file=sys.stderr)
        sys.exit(1)

    run(b_lat, b_lon)
