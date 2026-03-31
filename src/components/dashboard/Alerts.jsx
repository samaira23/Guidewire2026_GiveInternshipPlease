import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const mockAlerts = [
  "🌧️ Rain detected in your area",
  "🚧 Worksite paused",
  "🚗 Traffic disruption nearby",
];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const alert = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];

if (alert.includes("Rain")) {
  console.log("Trigger claim condition");
}
    const interval = setInterval(() => {
      const random = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
      setAlerts((prev) => [random, ...prev.slice(0, 2)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

const getColor = (alert) => {
  if (alert.includes("Rain")) return "text-yellow-400";
  if (alert.includes("Traffic")) return "text-red-400";
  return "text-green-400";
};
  return (
    <motion.div whileHover={{ scale: 1.03 }}>
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl mt-6">
      <h2 className="font-semibold mb-3">Live Alerts</h2>

      {alerts.map((alert, i) => (
        <motion.div
          key={i}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`p-3 bg-[#11141a] border border-[#2a2f3a] rounded ${getColor(alert)}`}
        >
          {alert}
        </motion.div>
      ))}
    </div>
    </motion.div>
  );
}