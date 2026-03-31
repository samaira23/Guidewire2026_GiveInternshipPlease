import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OTPInput from "../components/common/OTPInput";

export default function OTPVerification({ setIsVerified, role }) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading] = useState(false);
  const navigate = useNavigate();

const handleVerify = () => {
  if (otp.join("").length === 4) {
    setIsVerified(true);

    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  } else {
    alert("Invalid OTP");
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
          Secure verification for worker protection system
        </p>

        <p className="text-green-400 text-sm mt-4 animate-pulse">
          &gt; verifying identity...
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full md:w-1/2 justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1d24] border border-[#2a2f3a] p-8 rounded-xl w-[380px]"
        >
          <h2 className="text-2xl font-semibold mb-2">
            Enter OTP
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Code sent to your mobile number
          </p>

          {/* OTP INPUT */}
          <OTPInput otp={otp} setOtp={setOtp} />

          {/* VERIFY BUTTON */}
          <button
            onClick={handleVerify}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] transition py-3 rounded-md mt-6"
          >
            {loading ? "Verifying..." : "Verify & Continue →"}
          </button>

          {/* RESEND */}
          <p className="text-gray-500 text-xs mt-4 text-center">
            Didn’t receive code?{" "}
            <span className="text-blue-400 cursor-pointer">
              Resend
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}