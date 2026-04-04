import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function PremiumCard({ premium }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += 20;
      if (start >= premium) {
        start = premium;
        clearInterval(interval);
      }
      setDisplay(start);
    }, 20);

    return () => clearInterval(interval);
  }, [premium]);

  return (
    <motion.div whileHover={{ scale: 1.03 }}>
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-lg text-gray-500 mb-2">Current Premium</h2>

      <h1 className="text-5xl font-bold text-blue-400">
        ₹{display}
      </h1>

      <p className="text-gray-500 animate-pulse mt-2 text-lg">
        AI-adjusted pricing
      </p>
    </div>
    </motion.div>
  );
}