import { motion } from "framer-motion";
export default function RiskCard() {
  const risk = "Medium";

  const color =
    risk === "Low"
      ? "text-green-600"
      : risk === "Medium"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <motion.div whileHover={{ scale: 1.03 }}>
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="font-semibold mb-2">Risk Level</h2>
      <p className={`text-2xl font-bold ${color}`}>{risk}</p>
      <p className="text-sm text-gray-500 animate-pulse mt-2">
        Based on weather & work conditions
      </p>
    </div>
    </motion.div>
  );
}