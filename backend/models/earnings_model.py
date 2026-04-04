"""
Earnings Prediction Engine
--------------------------
Predicts expected daily income for a gig worker based on time of day,
location demand, historical delivery stats, and conditions.
Computes loss payout at 60-80% of expected earnings during disruption.

Model: GradientBoostingRegressor
Features: hour_of_day, day_of_week, zone_demand_score, avg_deliveries_per_day,
          avg_earnings_per_delivery, hours_worked_today, is_peak_hour, weather_severity
Target: expected_daily_earnings (₹)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "earnings_model.pkl")


def generate_synthetic_data(n_samples=5000):
    """Generate realistic synthetic earnings data for Indian gig workers."""
    np.random.seed(123)

    hour_of_day = np.random.randint(6, 23, size=n_samples)
    day_of_week = np.random.randint(0, 7, size=n_samples)  # 0=Mon, 6=Sun
    zone_demand_score = np.random.uniform(0.2, 1.0, size=n_samples)
    avg_deliveries_per_day = np.random.randint(8, 25, size=n_samples).astype(float)
    avg_earnings_per_delivery = np.random.uniform(30, 60, size=n_samples)
    hours_worked_today = np.random.uniform(2, 10, size=n_samples)
    is_peak_hour = ((hour_of_day >= 11) & (hour_of_day <= 14) | (hour_of_day >= 18) & (hour_of_day <= 21)).astype(float)
    weather_severity = np.random.uniform(0, 1, size=n_samples)

    base_earnings = avg_deliveries_per_day * avg_earnings_per_delivery
    peak_bonus = is_peak_hour * base_earnings * 0.15
    demand_factor = zone_demand_score * base_earnings * 0.2
    hours_factor = (hours_worked_today / 8) * base_earnings * 0.1
    weather_penalty = weather_severity * base_earnings * (-0.25)
    weekend_boost = ((day_of_week >= 5).astype(float)) * base_earnings * 0.08

    expected_daily_earnings = (
        base_earnings * 0.5
        + peak_bonus
        + demand_factor
        + hours_factor
        + weather_penalty
        + weekend_boost
        + np.random.normal(0, 30, size=n_samples)
    ).clip(200, 1500)

    df = pd.DataFrame({
        "hour_of_day": hour_of_day,
        "day_of_week": day_of_week,
        "zone_demand_score": zone_demand_score,
        "avg_deliveries_per_day": avg_deliveries_per_day,
        "avg_earnings_per_delivery": avg_earnings_per_delivery,
        "hours_worked_today": hours_worked_today,
        "is_peak_hour": is_peak_hour,
        "weather_severity": weather_severity,
        "expected_daily_earnings": expected_daily_earnings,
    })
    return df


def train():
    """Train the earnings prediction model and save to disk."""
    df = generate_synthetic_data()
    X = df.drop(columns=["expected_daily_earnings"])
    y = df["expected_daily_earnings"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.1,
        min_samples_split=5,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("=== Earnings Prediction Model ===")
    print(f"MAE: ₹{mean_absolute_error(y_test, y_pred):.2f}")
    print(f"R² Score: {r2_score(y_test, y_pred):.4f}")

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model


def load_model():
    """Load trained model from disk."""
    if not os.path.exists(MODEL_PATH):
        print("Earnings model not found, training now...")
        return train()
    return joblib.load(MODEL_PATH)


def predict(hour_of_day, day_of_week, zone_demand_score, avg_deliveries_per_day,
            avg_earnings_per_delivery, hours_worked_today, weather_severity):
    """
    Predict expected daily earnings and compute disruption payout.

    Returns:
        dict with expected_earnings, payout_amount, payout_percentage, breakdown
    """
    model = load_model()

    is_peak_hour = 1.0 if (11 <= hour_of_day <= 14 or 18 <= hour_of_day <= 21) else 0.0

    features = np.array([[
        hour_of_day, day_of_week, zone_demand_score, avg_deliveries_per_day,
        avg_earnings_per_delivery, hours_worked_today, is_peak_hour, weather_severity
    ]])

    expected_earnings = float(model.predict(features)[0])
    expected_earnings = max(200, min(1500, expected_earnings))

    payout_pct = 0.60 + (weather_severity * 0.20)
    payout_amount = round(expected_earnings * payout_pct, 2)

    feature_names = [
        "hour_of_day", "day_of_week", "zone_demand_score", "avg_deliveries_per_day",
        "avg_earnings_per_delivery", "hours_worked_today", "is_peak_hour", "weather_severity"
    ]
    importances = dict(zip(feature_names, [round(float(x), 4) for x in model.feature_importances_]))

    return {
        "expected_earnings": round(expected_earnings, 2),
        "payout_percentage": round(payout_pct * 100, 1),
        "payout_amount": payout_amount,
        "is_peak_hour": bool(is_peak_hour),
        "feature_importances": importances,
    }


if __name__ == "__main__":
    train()
    result = predict(
        hour_of_day=18, day_of_week=2, zone_demand_score=0.7,
        avg_deliveries_per_day=15, avg_earnings_per_delivery=45,
        hours_worked_today=6, weather_severity=0.8
    )
    print(f"\nSample prediction: {result}")
