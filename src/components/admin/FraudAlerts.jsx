export default function FraudAlerts() {
  const alerts = [
    "⚠ Multiple claims from same IP",
    "⚠ Unusual claim frequency detected",
    "⚠ Location mismatch anomaly",
  ];

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-red-400 mb-3">🚨 Fraud Alerts</h2>

      {alerts.map((a, i) => (
        <p key={i} className="text-red-300 text-sm mb-2">
          {a}
        </p>
      ))}
    </div>
  );
}