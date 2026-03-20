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

<img width="415" height="1756" alt="Input Manuscript (1)" src="https://github.com/user-attachments/assets/a8541b4e-de03-49df-8967-9c7e27a12358" />

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
* APIs: Weather, AQI, Traffic (mock-supported)
* Payments: Razorpay Sandbox / Mock UPI

## Development Plan

Phase 1:

* System architecture
* Architecture + README

Phase 2:

* Trigger engine plus core backend
* Automation of claims

Phase 3:

* Advanced detection of fraud
* Payout simulation and dashboard

## Adversarial Defense & Anti-Spoofing Strategy

Our solution is built with a multi-layer fraud defense architecture in response to recent widespread GPS spoofing attempts.

### Differentiation: Real vs Spoofed Behaviour

Our system uses physical and behavioral consistency to distinguish between ligitimate users and attackers:

| Real Worker |	Fraudster |
| ------------- | ------------- |
| Continuous micro-movements | Static or erratic location |
| Active delivery attempts | No activity |
| Natural speed patterns | Teleport/jump patterns |

> AI models examine not only location but also movement continuity and activity connection.

### Data Beyond GPS (Core Strength)

We employ a combination of behavioral intelligence and sensor fusion:

Signals of data:
* GPS trajectory, not just location
* Accelerometer and motion information
* Consistency in speed and direction
* Logs of delivery activities
* IP/network patterns
* Battery trends and device usage

Advanced Perspective:
> Real-world movements and behavioral patterns cannot be concurrently replicated by fake GPS signals.

### Critical Innovation in Group Fraud Detection

To counter coordinated assaults:
* Find groups of concurrent claims.
* Find comparable geographical and behavioral tendencies
* Report questionable "fraud rings"
> Prevents situations of mass exploitation.

### UX Equilibrium for Sincere Employees

We upload security while guaranteeing justice:

* A Confidence Score (0–1) was assigned to each assertion.
* Soft flagging system: no immediate rejection
* Payment delays in suspected cases
* Fallback for manual review

> Guarantees that legitimate employees are not penalized because of network problems or edge cases.

## Additional Features

Worker Dashboard
* Earnings protected
* Weekly coverage
* Risk alerts

Admin Dashboard
* Fraud alerts
* Claim analytics
* Risk heatmaps





