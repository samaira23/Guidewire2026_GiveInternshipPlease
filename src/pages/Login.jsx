import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login({ setRole }) {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const [role, setLocalRole] = useState("worker");

  const handleSendOTP = () => {
  if (phone.length === 10) {
    setRole(role);        // ✅ SAVE ROLE GLOBALLY
    navigate("/otp");     // ✅ ALWAYS GO TO OTP
  } else {
    alert("Enter valid number");
  }
};

  return (
    <div className="flex h-screen bg-[#0f1117] text-white">

      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center bg-[#11141a] border-r border-[#2a2f3a]">
        <h1 className="text-4xl font-bold text-blue-400 mb-4">
          SafetyNet
        </h1>

        <p className="text-gray-400 max-w-xs text-center">
          AI-powered insurance that protects workers from real-world disruptions.
        </p>

        <div className="mt-6 text-green-400 animate-pulse text-sm">
          ● system active
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full md:w-1/2 justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1d24] border border-[#2a2f3a] p-8 rounded-xl w-[380px]"
        >
          <h2 className="text-2xl font-semibold mb-2">
            Login / Register
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Enter your mobile number to continue
          </p>

          {/* INPUT */}
          <input
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded-md bg-[#11141a] border border-[#2a2f3a] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <div className="flex gap-4 mb-4 text-sm">
  <button
   onClick={() => setLocalRole("worker")}
    className={`px-3 py-1 rounded ${role === "worker" ? "bg-blue-600" : "bg-[#11141a]"}`}
  >
    Worker
  </button>

  <button
    onClick={() => setLocalRole("admin")}
    className={`px-3 py-1 rounded ${
      role === "admin" ? "bg-blue-600" : "bg-[#11141a]"
    }`}
  >
    Admin
  </button>
</div>

          {/* BUTTON */}
          <button
            onClick={handleSendOTP}
           className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] transition py-3 rounded-md font-medium" 
          >
            Send OTP →
          </button>

          {/* FOOTER */}
          <p className="text-gray-500 text-xs mt-6 text-center">
            Secure login powered by OTP verification
          </p>
        </motion.div>
      </div>
    </div>
  );
}