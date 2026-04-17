
import sys
import json
import math
import os
import requests
from datetime import datetime, timezone, timedelta

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(__file__)
HISTORY_FILE  = os.path.join(BASE_DIR, "location_history.json")
CLAIMS_LOG    = os.path.join(BASE_DIR, "claims_log.json")

# ── Thresholds ────────────────────────────────────────────────────────────────
IP_API_URL       = "http://ip-api.com/json/"
IP_API_FIELDS    = "city,district,lat,lon,proxy,hosting"
DRIFT_UPDATE_MIN = 0.2
DRIFT_BAND_LOW   = 0.3
DRIFT_BAND_HIGH  = 0.5
IP_GPS_MISMATCH  = 0.5
TRAVEL_MAX_KMH   = 120
CLAIM_WINDOW_H   = 24
CLAIM_FREQ_MAX   = 3
STATIC_EPS       = 0.001
STATIC_N         = 5
SCORE_CAP        = 10

BANDS = {
    (1, 3):  "Low risk - pass to weather check",
    (4, 5):  "Medium risk - supervisor review",
    (6, 8):  "High risk - manual adjudication",
    (9, 10): "Auto-reject",
}


def band_label(score: int) -> str:
    for (lo, hi), label in BANDS.items():
        if lo <= score <= hi:
            return label
    return "Auto-reject"


# ── Haversine ─────────────────────────────────────────────────────────────────
def haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── History helpers ───────────────────────────────────────────────────────────
def load_history() -> dict:
    if not os.path.exists(HISTORY_FILE) or os.path.getsize(HISTORY_FILE) == 0:
        return {"previous_location": None, "claims": []}
    try:
        with open(HISTORY_FILE) as f:
            h = json.load(f)
    except json.JSONDecodeError:
        h = {"previous_location": None, "claims": []}
    h.setdefault("claims", [])
    return h


def save_history(h: dict) -> None:
    h["claims"] = h["claims"][-100:]
    with open(HISTORY_FILE, "w") as f:
        json.dump(h, f, indent=2)


def append_claim_log(record: dict) -> None:
    log = []
    if os.path.exists(CLAIMS_LOG) and os.path.getsize(CLAIMS_LOG) > 0:
        try:
            with open(CLAIMS_LOG) as f:
                log = json.load(f)
        except json.JSONDecodeError:
            pass
    log.append(record)
    with open(CLAIMS_LOG, "w") as f:
        json.dump(log, f, indent=2)


# ── Network helpers ───────────────────────────────────────────────────────────
def discover_public_ip() -> str | None:
    try:
        r = requests.get("https://api.ipify.org?format=json", timeout=5)
        return r.json()["ip"]
    except Exception as e:
        print(f"[WARN] ipify: {e}", file=sys.stderr)
        return None


def fetch_ip_details(ip: str) -> dict:
    r = requests.get(IP_API_URL + ip, params={"fields": IP_API_FIELDS}, timeout=5)
    return r.json()


# ── Core scoring ──────────────────────────────────────────────────────────────
def compute_score(browser_lat: float, browser_lon: float) -> dict:
    score   = 0
    reasons = []
    now     = datetime.now(timezone.utc)
    history = load_history()

    # 1. IP reputation
    public_ip = discover_public_ip()
    ip_data   = {}
    if not public_ip:
        score += 5
        reasons.append("Could not determine public IP (+5)")
    else:
        ip_data = fetch_ip_details(public_ip)
        print(f"[IP] {public_ip} -> {ip_data}", file=sys.stderr)

        if ip_data.get("proxy"):
            score += 5
            reasons.append("VPN/proxy detected (+5)")
        elif ip_data.get("hosting"):
            score += 2
            reasons.append("Hosting/datacenter IP (+2)")

    # 2. IP-geo vs GPS mismatch
    ip_lat, ip_lon = ip_data.get("lat"), ip_data.get("lon")
    if ip_lat and ip_lon:
        gap = max(abs(browser_lat - ip_lat), abs(browser_lon - ip_lon))
        if gap > IP_GPS_MISMATCH:
            score += 3
            reasons.append(f"IP-geo vs GPS mismatch {gap:.3f} deg (+3)")

    # 3. Location drift vs stored previous
    prev = history.get("previous_location")
    if prev:
        d_lat = abs(browser_lat - prev["lat"])
        d_lon = abs(browser_lon - prev["lon"])
        drift = max(d_lat, d_lon)
        print(f"[LOCATION] prev=({prev['lat']},{prev['lon']}) curr=({browser_lat},{browser_lon}) drift={drift:.4f}", file=sys.stderr)

        if drift > DRIFT_UPDATE_MIN:
            history["previous_location"] = {"lat": browser_lat, "lon": browser_lon, "timestamp": now.isoformat()}
            if DRIFT_BAND_LOW < drift < DRIFT_BAND_HIGH:
                score += 2
                reasons.append(f"Suspicious drift {drift:.4f} deg (+2)")
            elif drift >= DRIFT_BAND_HIGH:
                score += 4
                reasons.append(f"Large drift {drift:.4f} deg (+4)")
    else:
        history["previous_location"] = {"lat": browser_lat, "lon": browser_lon, "timestamp": now.isoformat()}
        print("[LOCATION] First check - seeding history", file=sys.stderr)

    # 4. Impossible travel speed
    claims = history.get("claims", [])
    if claims:
        last = claims[-1]
        elapsed_h = (now - datetime.fromisoformat(last["timestamp"])).total_seconds() / 3600
        if elapsed_h > 0:
            dist_km = haversine_km(last["lat"], last["lon"], browser_lat, browser_lon)
            speed   = dist_km / elapsed_h
            print(f"[TRAVEL] {dist_km:.1f} km / {elapsed_h:.2f} h = {speed:.0f} km/h", file=sys.stderr)
            if speed > TRAVEL_MAX_KMH:
                score += 4
                reasons.append(f"Impossible travel {speed:.0f} km/h (+4)")

    # 5. Claim frequency
    window = now - timedelta(hours=CLAIM_WINDOW_H)
    recent = [c for c in claims if datetime.fromisoformat(c["timestamp"]) > window]
    if len(recent) >= CLAIM_FREQ_MAX:
        score += 2
        reasons.append(f"Claim frequency {len(recent)} in {CLAIM_WINDOW_H}h (+2)")

    # 6. Static / spoofed GPS
    if len(claims) >= STATIC_N - 1:
        last_n = claims[-(STATIC_N - 1):]
        if all(abs(c["lat"] - browser_lat) <= STATIC_EPS and abs(c["lon"] - browser_lon) <= STATIC_EPS for c in last_n):
            score += 3
            reasons.append(f"Static GPS across {STATIC_N} checks (+3)")

    # 7. Off-hours
    if now.hour < 5 or now.hour >= 23:
        score += 1
        reasons.append(f"Off-hours (UTC {now.hour:02d}:xx) (+1)")

    # Finalise
    score = min(score, SCORE_CAP)

    # Append this event to the rolling claim history
    history["claims"].append({"lat": browser_lat, "lon": browser_lon, "timestamp": now.isoformat()})
    save_history(history)

    # Build full record for the persistent log
    record = {
        "timestamp":      now.isoformat(),
        "ip":             public_ip,
        "ip_data":        ip_data,
        "browser_coords": {"lat": browser_lat, "lon": browser_lon},
        "fraud_score":    score,
        "band":           band_label(score),
        "reasons":        reasons,
    }
    append_claim_log(record)

    print(f"[RESULT] score={score}  band={band_label(score)}", file=sys.stderr)
    print(f"[RESULT] reasons={reasons}", file=sys.stderr)

    return record


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python Crosscheck-ip.py <latitude> <longitude>", file=sys.stderr)
        sys.exit(1)
    try:
        b_lat = float(sys.argv[1])
        b_lon = float(sys.argv[2])
    except ValueError:
        print("ERROR: lat/lon must be numeric", file=sys.stderr)
        sys.exit(1)

    result = compute_score(b_lat, b_lon)

    # The only thing on stdout is the integer score
    print(result["fraud_score"])