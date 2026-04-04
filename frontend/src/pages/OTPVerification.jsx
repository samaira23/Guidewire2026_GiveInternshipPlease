import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OTPInput from "../components/common/OTPInput";
import { verifyOtp } from "../api";

export default function OTPVerification({ setIsVerified, role }) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const phone = localStorage.getItem("phone") || "";
  const demoOtp = localStorage.getItem("demoOtp") || "";

  const handleVerify = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 4) {
      setError("Please enter all 4 digits");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await verifyOtp(phone, otpStr);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      setIsVerified(true);

      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
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

          <p className="text-gray-400 text-sm mb-2">
            Code sent to {phone || "your mobile number"}
          </p>

          {/* Demo OTP hint */}
          {demoOtp && (
            <p className="text-yellow-400 text-xs mb-4 bg-[#11141a] p-2 rounded">
              📱 Demo OTP: <span className="font-bold tracking-widest">{demoOtp}</span>
            </p>
          )}

          {/* OTP INPUT */}
          <OTPInput otp={otp} setOtp={setOtp} />

          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}

          {/* VERIFY BUTTON */}
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 transition py-3 rounded-md mt-6"
          >
            {loading ? "Verifying..." : "Verify & Continue →"}
          </button>

          {/* RESEND */}
          <p className="text-gray-500 text-xs mt-4 text-center">
            Didn't receive code?{" "}
            <span
              className="text-blue-400 cursor-pointer"
              onClick={() => navigate("/")}
            >
              Resend
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}