import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAlerts } from "../../api";

const FALLBACK_ALERTS = [
  { message: "🌧️ Rain detected in your area", type: "weather" },
  { message: "🚧 Worksite paused", type: "work" },
  { message: "🚗 Traffic disruption nearby", type: "traffic" },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch initial alerts from backend
    getAlerts()
      .then((data) => {
        if (data && data.length > 0) setAlerts(data);
        else setAlerts(FALLBACK_ALERTS);
      })
      .catch(() => setAlerts(FALLBACK_ALERTS));

    // Rotate alerts every 4s for live feel
    const interval = setInterval(() => {
      getAlerts()
        .then((data) => {
          if (data && data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)];
            setAlerts((prev) => [random, ...prev.slice(0, 2)]);
          }
        })
        .catch(() => {
          const pool = FALLBACK_ALERTS;
          const random = pool[Math.floor(Math.random() * pool.length)];
          setAlerts((prev) => [random, ...prev.slice(0, 2)]);
        });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getColor = (type) => {
    if (type === "weather") return "text-yellow-400";
    if (type === "traffic") return "text-red-400";
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
            className={`p-3 bg-[#11141a] border border-[#2a2f3a] rounded mb-2 ${getColor(alert.type || "work")}`}
          >
            {alert.message}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}