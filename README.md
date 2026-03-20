# AI-Powered Hyperlocal Gig Workers' Income Security

## Problem Understanding & Core Requirememts

Gig delivery workers in India frequently experience income disruptions as a result of outside variables including intense heat, heavy rain, pollution, and abrupt curfews. With no current financial safety net, these occurrences could cut their revenues by 20-30%.
Developing a parametric insurance platform driven by AI that:
* detects disruption incidents automatically.
* computes the loss of income.
* causes immediate payouts.
* stops fraud and system abuse.

## Person-Based Scenario

### Persona: Zepto Delivery Partner (Chennai)
* Earnings per days: ₹600–₹900
* works 8-10 hours per day, depending on peak hours.
* weather and demand have a significant impact on income.

### Situation:
Heavy rain starts to fall in the worker's zone at 6 PM:

* Orders drastically decline.
* An employee is unable to work securely.
* Loss of income starts right away.

### System Workflow in Action:

```
Worker Active -> Rain Trigger Detected -> Risk Engine Validates Zone ->
Earnings Predictor Calculates Loss -> Fraud Check -> Instant Payout

```
* The worker receives:
  > ₹180 credited due to heavy rainfall disruption
No claim filing required.

## Application Workflow
</br>

<img width="200" height="500" alt="Input Manuscript (1)" src="https://github.com/user-attachments/assets/a8541b4e-de03-49df-8967-9c7e27a12358" />

</br>
</br>

## Weekly Premium Model

The Weekly income cycle of gig workers is the basis for the pricing model.

> Premium Formula: (Risk Score * Disruption Probability * Activity Factor) + Base

### Factors Considered:

* Historical zone-based risk (heat, pollution, floods)
* Weather predictions for the next week.
* Patterns of worker activity (hours, frequency of deliveries)

  Example plans:

| Plan  | Price | Coverage |
| ------------- | ------------- | ------------- |
| Basic  | ₹15/week  | Rain |
| Standard | ₹25/week | Rain + Heat |
| Premium | ₹40/week | All disruptions |

## Parametric Triggers

The system uses real-time triggers which are objective to initiate claims:

| Trigger Type | Condition |
| ------------ | ------------ |
| Rain | Rainfall > 20mm |
| Pollution | AQI > 300 |
| Heat | Temperature > 42°C |
| Traffic / Curfew | API / simulated input |

> once triggered, claims are produced automatically without user input.

## AI/ML Integration

1. Engine for Risk Prediction
   * estimates the likelihood of disruption for each zone.
   * dynamically modifies the weekly premium.

2. Key Differentiator: Earnings Prediction Engine
   * Rather than set payouts:
     * estimates the anticipated daily income.
   * Applications:
     * The time of day
     * demand for location
  > pays 60-80% of expected earnings based on historical delivery statistics.

3. Engine for Fraud Detection
   * Detects:
     * false assertions
     * spoofing GPS
     * coordinated fraudulent schemes
   * Applications:
     * Identification of behavioral anomalies
     * Identification of patterns
     * validation of several signals
    
## Tech Stack

* Frontend: React.js
* Backend: Django/ Node.js
* Database: PostgreSQL / MongoDB
* AI Layer: Python (Scikit-learn / TensorFlow)
* Anomaly Detection: Isolation Forest, LSTM (trajectory), 
  DBSCAN (ring detection)
* APIs: Weather, AQI, Traffic (mock-supported)
* Payments: Razorpay Sandbox / Mock UPI

## Development Plan

| Phase | Focus |
|-------|-------|
| Phase 1 | System architecture, README, design |
| Phase 2 | Core backend, trigger engine, claims automation |
| Phase 3 | Fraud detection, dashboard, payout simulation |

# Adversarial Defense & Anti-Spoofing Strategy

### The Threat We Are Defending Against

A coordinated syndicate can organize via Telegram, deploy GPS spoofing 
apps, and simultaneously fake locations inside a declared red-alert weather 
zone — draining the liquidity pool while sitting safely at home. Simple 
coordinate verification cannot distinguish this from a genuine worker. 
Our defense operates at three levels.

### Differentiation: Real vs Spoofed Behaviour

The fundamental realization: **a GPS coordinate is a claim. Behaviour serves as proof.**

A real delivery person stuck in torrential rain generates a stream of data from several sensors that is continuous and physically consistent. A spoofer generates a GPS signal that is either artifically injected or static and has no physical counterpart.

Our system uses physical and behavioral consistency to distinguish between ligitimate users and attackers:

| Signal | Genuine Worker | GPS Spoofer |
| -------- | --------------- | ------------- |
| GPS trajectory | Continuous micro-movements, natural drift | Static pin or scripted jump patterns |
| Accelerometer / IMU | Rhythmic motion consistent with riding or walking | Flat / zero variance |
| Speed & heading | Gradual, road-constrained changes | Teleport-level jumps or impossible vectors |
| Delivery activity logs | Attempted pickups, app interactions, order pings | No platform-side activity |
| Battery & device usage | Active screen, navigation apps running | Idle device profile |

An anomaly detection model (Isolation Forest + LSTM for trajectory continuity) calculates a **Physical Consistency Score**² \in [0, 1]² for each claim. The absence of accelerometer variance, road-consistent mobility, and active delivery efforts cannot all be faked by a spoofer at the same time. However, they can falsify their GPS positions.

The fundamental idea is that a single spoof signal cannot recreate motion in the actual environment.

| Real Worker |	Fraudster |
| ------------- | ------------- |
| Continuous micro-movements | Static or erratic location |
| Active delivery attempts | No activity |
| Natural speed patterns | Teleport/jump patterns |

> AI models examine not only location but also movement continuity and activity connection.

### 2. Information Used to Find a Coordinated Fraud Ring

Fraud on an individual basis can be identified. An extra layer is needed for coordinated fraud: **group behavioral analysis.

Our system does not just assess each claim separately when a parametric trigger (such as the declaration of a red-alert rain zone) triggers; instead, it executes a 
**Cluster Analysis** for every concurrent claim in that area.

Analyzed data signals:

Despite covering a 5 km stated zone, are claims coming from an abnormally tight geographic cluster—all pegged to the same 100 m radius?
Rather than being spread normally across time, did a statistically unlikely amount of claims arrive within seconds of the trigger event? This is known as temporal synchronization.
Device and network fingerprinting: Do several claims have the same IP subnet, device model, or GPS app signature?
- **Cross-worker behavioral similarity:** Do the trajectory profiles of claimants in the same ring look statistically identical — a pattern impossible in organic human movement?
- **Historical claim velocity:** Has this worker (or cluster of workers) filed claims at a rate inconsistent with their baseline activity profile?

Suspicious cohorts are flagged for closer examination by a **Ring Detection Model** (graph-based clustering, such as DBSCAN over claim vectors). * Distributed, varied* claim patterns are produced by a valid weather event. Coordinated fraud rings result in *homogeneous, synchronized*

$$
\text{Ring Risk Score} = f(\text{spatial density},\ \text{temporal sync},\ 
\text{device overlap},\ \text{trajectory similarity})
$$

### 3. UX Balance: Protecting Honest Workers from False Flags

The most challenging design issue is this one. During a storm, a worker using a cheap Android in a concrete basement will have intermittent network, poor accelerometer signal, and degraded GPS, all of which appear to be spoofing indicators. Poverty and poor connectivity must not be penalized by our system.

Instead of using a binary approve/reject system, our solution is a **graduated response architecture**:

```
Claim Submitted
      │
      ▼
Physical Consistency Score computed
      │
   ┌──┴──────────────────────┬─────────────────────────┐
   │                         │                         │
Score > 0.75           0.4 < Score < 0.75         Score < 0.4
   │                         │                         │
Instant Payout         Soft Flag:                Hard Flag:
(normal flow)          Payout delayed            Payout held,
                       24–48 hrs,                escalated to
                       passive monitoring        manual review,
                       continues. Worker         worker notified
                       notified with reason.     transparently.
```

**Key design principles:**

* There are no silent rejections. Instead of being rejected, a worker who has been flagged always receives a message 
 outlining the reason for the delay. Trust is maintained in this way.
* The Physical Consistency Score is weighted in favor of acceptance if the GPS signal deteriorates but the accelerometer and delivery activity logs stay consistent.
* Employees who are subject to manual review are not placed on a blacklist; instead, reviewers consider their complete past performance before making a decision.
* In order to avoid immediate hardship, employees can submit a one-tap "I was genuinely stranded" flag, which queues a human review and temporarily unlocks a partial advance payout (about 40\%).

The goal is a system where a fraudster faces a wall, and a legitimate worker in a bad-signal situation faces a short delay — not a denial.


## Additional Features

Worker Dashboard
* Earnings protected
* Weekly coverage
* Risk alerts

Admin Dashboard
* Fraud alerts
* Claim analytics
* Risk heatmaps





