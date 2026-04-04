import { motion } from "framer-motion";
export default function ClaimCard({ claim }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }}>
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="font-semibold text-lg mb-3 text-green-600">
        ✅ Auto-Generated Claim
      </h2>

      <p>Reason: {claim.reason}</p>
      <p>Duration: {claim.duration}</p>
      <p className="font-bold">Payout: ₹{claim.payout}</p>

      <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-md transition">
        Confirm Claim
      </button>
    </div>
    </motion.div>
  );
}