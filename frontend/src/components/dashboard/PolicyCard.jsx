import { motion } from "framer-motion";

export default function PolicyCard({ policy }) {
  const name = policy?.name || 'WorkerShield Gold';
  const policyId = policy?.policy_id || 'SN-9920-X';
  const coverage = policy?.coverage_amount ?? 500000;
  const dailyPremium = policy?.daily_premium ?? 14;

  return (
    <motion.div whileHover={{ scale: 1.03 }}>
      <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
        <h2 className="text-xl font-semibold">{name}</h2>
        <p className="text-gray-500 animate-pulse">Policy ID: {policyId}</p>

        <div className="mt-4">
          <p>Total Coverage: ₹{Number(coverage).toLocaleString('en-IN')}</p>
          <p>Premium: ₹{dailyPremium}/day</p>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-md transition">
            Download
          </button>
          <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-md transition">
            Update
          </button>
        </div>
      </div>
    </motion.div>
  );
}