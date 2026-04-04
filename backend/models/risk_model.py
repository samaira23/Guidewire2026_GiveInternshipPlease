"""
Risk Prediction Engine
---------------------
Predicts disruption probability for a zone based on weather, AQI, temperature,
and historical risk data. Dynamically adjusts weekly premium.

Model: RandomForestClassifier
Features: rainfall_mm, temperature_c, aqi, hour_of_day, zone_risk_history, is_weekend
Target: disruption (0 or 1)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")


def generate_synthetic_data(n_samples=5000):
    """Generate realistic synthetic data for risk prediction."""
    np.random.seed(42)

    rainfall_mm = np.random.exponential(scale=10, size=n_samples).clip(0, 80)
    temperature_c = np.random.normal(loc=34, scale=6, size=n_samples).clip(15, 50)
    aqi = np.random.exponential(scale=120, size=n_samples).clip(20, 500)
    hour_of_day = np.random.randint(6, 23, size=n_samples)
    zone_risk_history = np.random.uniform(0, 1, size=n_samples)
    is_weekend = np.random.binomial(1, 2 / 7, size=n_samples)

    disruption_score = (
        (rainfall_mm > 20).astype(float) * 0.35
        + (temperature_c > 42).astype(float) * 0.25
        + (aqi > 300).astype(float) * 0.20
        + zone_risk_history * 0.15
        + (hour_of_day >= 17).astype(float) * 0.05
    )
    noise = np.random.normal(0, 0.08, size=n_samples)
    disruption = (disruption_score + noise > 0.30).astype(int)

    df = pd.DataFrame({
        "rainfall_mm": rainfall_mm,
        "temperature_c": temperature_c,
        "aqi": aqi,
        "hour_of_day": hour_of_day,
        "zone_risk_history": zone_risk_history,
        "is_weekend": is_weekend,
        "disruption": disruption,
    })
    return df


def train():
    """Train the risk prediction model and save to disk."""
    df = generate_synthetic_data()
    X = df.drop(columns=["disruption"])
    y = df["disruption"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
    )
    model.fit(X_train, y_train)

    print("=== Risk Prediction Model ===")
    print(classification_report(y_test, model.predict(X_test)))

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model


def load_model():
    """Load trained model from disk."""
    if not os.path.exists(MODEL_PATH):
        print("Risk model not found, training now...")
        return train()
    return joblib.load(MODEL_PATH)


def predict(rainfall_mm, temperature_c, aqi, hour_of_day, zone_risk_history, is_weekend=0):
    """
    Predict disruption probability and compute dynamic premium.

    Returns:
        dict with disruption_probability, risk_level, adjusted_premium
    """
    model = load_model()
    features = np.array([[rainfall_mm, temperature_c, aqi, hour_of_day, zone_risk_history, is_weekend]])
    proba = model.predict_proba(features)[0]
    disruption_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])

    if disruption_prob < 0.3:
        risk_level = "Low"
    elif disruption_prob < 0.6:
        risk_level = "Medium"
    else:
        risk_level = "High"

    base_premium = 25
    risk_multiplier = 1 + (disruption_prob * 0.8)
    activity_factor = max(0.7, 1 - zone_risk_history * 0.3)
    adjusted_premium = round(base_premium * risk_multiplier * activity_factor, 2)

    feature_names = ["rainfall_mm", "temperature_c", "aqi", "hour_of_day", "zone_risk_history", "is_weekend"]
    importances = dict(zip(feature_names, [round(float(x), 4) for x in model.feature_importances_]))

    return {
        "disruption_probability": round(disruption_prob, 4),
        "risk_level": risk_level,
        "base_premium": base_premium,
        "adjusted_premium": adjusted_premium,
        "risk_multiplier": round(risk_multiplier, 4),
        "feature_importances": importances,
    }


if __name__ == "__main__":
    train()
    result = predict(rainfall_mm=25, temperature_c=38, aqi=150, hour_of_day=18, zone_risk_history=0.6)
    print(f"\nSample prediction: {result}")
