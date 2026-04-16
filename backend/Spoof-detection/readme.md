Pipeline : IP check (output is risk score, if <4 it wont go ahead)-> Pollution or weather (output is a yes or no)               


! Remove ts after you integrate the button:
Flask app (temp page to check pipeline):
Endpoints:
    GET  /                  -> HTML page
    POST /api/crosscheck    -> {lat, lon} -> {score, band, reasons, ip}
    POST /api/air-quality   -> {lat, lon} -> {result: "yes"/"no", ...}
    POST /api/weather       -> {lat, lon} -> {result: "yes"/"no", ...}



##Ip cross check:

OUTPUT  : A single integer 1-10 printed to stdout. That is the only thing
          written to stdout. All diagnostic detail goes to stderr.
STORAGE : Every check is appended to claims_log.json for future reference.

Fraud score bands (1-10, capped):
    1-3   Low risk      -> pass to weather check
    4-5   Medium risk   -> supervisor review
    6-8   High risk     -> manual adjudication
    9-10  Auto-reject

Signal weights:
    +5   VPN / explicit proxy                   (ip-api proxy=true)
    +2   Hosting / datacenter IP                (ip-api hosting=true, proxy=false)
    +3   IP-geolocation vs GPS mismatch > 0.5 deg
    +2   Suspicious location drift 0.3-0.5 deg
    +4   Large location drift >= 0.5 deg
    +4   Impossible travel speed > 120 km/h
    +2   Claim frequency > 3 in rolling 24 h
    +3   Static / spoofed GPS (same spot 3+ times)
    +1   Off-hours submission (before 05:00 or after 23:00 UTC)



##Air quality check :
Permissible limits (WHO 2021 Air Quality Guidelines, 24-hour mean):
    AQI    >= 3 (Moderate / Poor / Very Poor)
    PM2.5  >= 25  ug/m3
    PM10   >= 45  ug/m3
    NO2    >= 25  ug/m3
    O3     >= 100 ug/m3
    SO2    >= 40  ug/m3
    CO     >= 4000 ug/m3  (4 mg/m3)



##Weather check:
   
  Unfavourable weather is declared when ANY of the following is true:
    - Precipitation group: Thunderstorm / Drizzle / Rain / Snow
      (OWM condition IDs: 200-531, 600-622)
    - Extreme atmospheric events: Tornado, Squall
      (OWM condition IDs: 781, 771)
    - Temperature >= 38 C (extreme heat)
    - Wind speed >= 20 m/s (~72 km/h, storm-force)

OUTPUT  : "yes" (weather is unfavourable, claim supported)
          "no"  (weather is acceptable, claim not supported)  on stdout.
