import { motion } from "framer-motion";

export default function ScoreCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl"
    >
      <h2 className="text-lg font-semibold">Safety Score</h2>
      <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="text-4xl font-bold text-blue-600 mt-2"
>
  82 / 100
</motion.div>
    </motion.div>
  );
}