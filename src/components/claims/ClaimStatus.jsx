import { motion } from "framer-motion";
export default function ClaimStatus() {
  return (
<motion.div whileHover={{ scale: 1.03 }}>
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl mt-4">
      <h2 className="font-semibold mb-3">Claim Status</h2>

      <div className="flex justify-between text-sm">
        <span>Submitted</span>
        <span>Processing</span>
        <span>Approved</span>
        <span>Paid</span>
      </div>
    </div>
    </motion.div>
  );
}