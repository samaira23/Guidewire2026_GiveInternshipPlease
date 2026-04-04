"""
Fraud Detection Engine
----------------------
Detects fraudulent claims using:
1. Isolation Forest for individual anomaly detection
2. DBSCAN-style clustering for coordinated fraud ring detection
3. Physical Consistency Score based on behavioral signals

Features analyzed:
- GPS trajectory consistency (variance in micro-movements)
- Accelerometer variance (is the device actually moving?)
- Speed consistency (are speed changes road-realistic?)
- Claim timing relative to trigger event
- Historical claim frequency
- Device/network fingerprint overlap with other claimants
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "fraud_scaler.pkl")


def generate_synthetic_data(n_samples=5000):
    """
    Generate synthetic claim data with ~10% fraud rate.
    Genuine workers have continuous movement, natural variance.
    Fraudsters have static GPS, zero accelerometer, suspicious timing.
    """
    np.random.seed(99)

    n_fraud = int(n_samples * 0.10)
    n_legit = n_samples - n_fraud

    legit = pd.DataFrame({
        "gps_variance": np.random.uniform(0.001, 0.05, n_legit),
        "accelerometer_variance": np.random.uniform(0.3, 2.0, n_legit),
        "speed_consistency": np.random.uniform(0.6, 1.0, n_legit),
        "claim_delay_seconds": np.random.exponential(300, n_legit).clip(30, 3600),
        "claims_last_30_days": np.random.poisson(2, n_legit).clip(0, 8),
        "delivery_attempts_during_claim": np.random.poisson(3, n_legit).clip(0, 10),
        "device_ip_overlap_count": np.random.poisson(0.5, n_legit).clip(0, 3),
        "trajectory_linearity": np.random.uniform(0.1, 0.6, n_legit),
        "is_fraud": 0,
    })

    fraud = pd.DataFrame({
        "gps_variance": np.random.uniform(0.0, 0.005, n_fraud),
        "accelerometer_variance": np.random.uniform(0.0, 0.15, n_fraud),
        "speed_consistency": np.random.uniform(0.0, 0.3, n_fraud),
        "claim_delay_seconds": np.random.uniform(1, 30, n_fraud),
        "claims_last_30_days": np.random.poisson(6, n_fraud).clip(2, 15),
        "delivery_attempts_during_claim": np.random.poisson(0.3, n_fraud).clip(0, 2),
        "device_ip_overlap_count": np.random.poisson(3, n_fraud).clip(1, 10),
        "trajectory_linearity": np.random.uniform(0.7, 1.0, n_fraud),
        "is_fraud": 1,
    })

    df = pd.concat([legit, fraud], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
    return df


def train():
    """Train the Isolation Forest fraud detection model."""
    df = generate_synthetic_data()
    feature_cols = [c for c in df.columns if c != "is_fraud"]
    X = df[feature_cols]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.10,
        max_samples="auto",
        random_state=42,
    )
    model.fit(X_scaled)

    predictions = model.predict(X_scaled)
    predicted_fraud = (predictions == -1).astype(int)
    actual_fraud = df["is_fraud"].values

    tp = ((predicted_fraud == 1) & (actual_fraud == 1)).sum()
    fp = ((predicted_fraud == 1) & (actual_fraud == 0)).sum()
    fn = ((predicted_fraud == 0) & (actual_fraud == 1)).sum()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0

    print("=== Fraud Detection Model ===")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"Fraud detected: {predicted_fraud.sum()} / {actual_fraud.sum()} actual")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model, scaler


def load_model():
    """Load trained model and scaler."""
    if not os.path.exists(MODEL_PATH):
        print("Fraud model not found, training now...")
        return train()
    return joblib.load(MODEL_PATH), joblib.load(SCALER_PATH)


def compute_physical_consistency_score(gps_variance, accelerometer_variance,
                                        speed_consistency, delivery_attempts):
    """
    Compute Physical Consistency Score ∈ [0, 1].
    Higher = more likely genuine. Based on README's anti-spoofing strategy.
    """
    gps_score = min(gps_variance / 0.03, 1.0)
    accel_score = min(accelerometer_variance / 1.5, 1.0)
    speed_score = speed_consistency
    activity_score = min(delivery_attempts / 3.0, 1.0)

    score = (
        gps_score * 0.20
        + accel_score * 0.30
        + speed_score * 0.25
        + activity_score * 0.25
    )
    return round(min(max(score, 0), 1), 4)


def detect_fraud_ring(claims_batch):
    """
    DBSCAN-based ring detection for concurrent claims in a zone.
    Input: list of dicts with lat, lng, claim_timestamp, device_fingerprint
    Returns: ring_detected (bool), clusters found
    """
    if len(claims_batch) < 3:
        return {"ring_detected": False, "num_clusters": 0, "suspicious_clusters": []}

    coords = np.array([[c["lat"], c["lng"]] for c in claims_batch])
    timestamps = np.array([c["claim_timestamp"] for c in claims_batch])

    t_norm = (timestamps - timestamps.min())

    features = np.column_stack([
        coords[:, 0] * 1000,
        coords[:, 1] * 1000,
        t_norm / 60,
    ])

    clustering = DBSCAN(eps=0.5, min_samples=3).fit(features)
    labels = clustering.labels_
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)

    suspicious = []
    for label in set(labels):
        if label == -1:
            continue
        cluster_mask = labels == label
        cluster_size = cluster_mask.sum()
        time_spread = t_norm[cluster_mask].max() - t_norm[cluster_mask].min()
        spatial_spread = np.std(coords[cluster_mask], axis=0).mean()

        if cluster_size >= 3 and time_spread < 60 and spatial_spread < 0.002:
            suspicious.append({
                "cluster_id": int(label),
                "size": int(cluster_size),
                "time_spread_seconds": round(float(time_spread), 1),
                "spatial_spread": round(float(spatial_spread), 6),
            })

    return {
        "ring_detected": len(suspicious) > 0,
        "num_clusters": n_clusters,
        "suspicious_clusters": suspicious,
    }


def predict(gps_variance, accelerometer_variance, speed_consistency,
            claim_delay_seconds, claims_last_30_days, delivery_attempts_during_claim,
            device_ip_overlap_count, trajectory_linearity):
    """
    Run fraud detection on a single claim.

    Returns:
        dict with fraud_score, physical_consistency_score, decision, flags
    """
    model, scaler = load_model()

    features = np.array([[
        gps_variance, accelerometer_variance, speed_consistency,
        claim_delay_seconds, claims_last_30_days, delivery_attempts_during_claim,
        device_ip_overlap_count, trajectory_linearity
    ]])
    features_scaled = scaler.transform(features)

    raw_score = model.decision_function(features_scaled)[0]
    prediction = model.predict(features_scaled)[0]

    fraud_score = round(max(0, min(1, 0.5 - float(raw_score))), 4)

    pcs = compute_physical_consistency_score(
        gps_variance, accelerometer_variance,
        speed_consistency, delivery_attempts_during_claim
    )

    flags = []
    if gps_variance < 0.005:
        flags.append("Static/scripted GPS pattern")
    if accelerometer_variance < 0.15:
        flags.append("No physical motion detected")
    if claim_delay_seconds < 30:
        flags.append("Suspiciously fast claim after trigger")
    if claims_last_30_days > 5:
        flags.append("High claim frequency")
    if device_ip_overlap_count > 2:
        flags.append("Device/IP overlap with other claimants")
    if trajectory_linearity > 0.7:
        flags.append("Scripted trajectory pattern")

    if pcs > 0.75:
        decision = "APPROVE"
        action = "Instant payout"
    elif pcs > 0.4:
        decision = "SOFT_FLAG"
        action = "Payout delayed 24-48 hrs, passive monitoring"
    else:
        decision = "HARD_FLAG"
        action = "Payout held, escalated to manual review"

    return {
        "fraud_score": fraud_score,
        "physical_consistency_score": pcs,
        "is_anomaly": bool(prediction == -1),
        "decision": decision,
        "action": action,
        "flags": flags,
    }


if __name__ == "__main__":
    train()

    print("\n--- Genuine worker ---")
    result = predict(
        gps_variance=0.02, accelerometer_variance=1.2, speed_consistency=0.8,
        claim_delay_seconds=300, claims_last_30_days=2, delivery_attempts_during_claim=3,
        device_ip_overlap_count=0, trajectory_linearity=0.3
    )
    print(result)

    print("\n--- Suspected spoofer ---")
    result = predict(
        gps_variance=0.001, accelerometer_variance=0.05, speed_consistency=0.1,
        claim_delay_seconds=5, claims_last_30_days=8, delivery_attempts_during_claim=0,
        device_ip_overlap_count=4, trajectory_linearity=0.9
    )
    print(result)
