import { motion } from "framer-motion";
const activities = [
  "Rain detected → risk increased",
  "Safe week → discount applied",
  "Policy updated",
];

export default function ActivityTimeline() {
  return (
    <motion.div whileHover={{ scale: 1.03 }}>
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="font-semibold mb-3">Activity Timeline</h2>

      <ul className="space-y-2 text-sm">
        {activities.map((a, i) => (
          <li key={i} className="border-l-2 pl-3">
            {a}
          </li>
        ))}
      </ul>
    </div>
    </motion.div>
  );
}