import { useRef } from "react";

export default function OTPInput({ otp, setOtp }) {
  const inputs = useRef([]);

  const handleChange = (value, i) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[i] = value;
    setOtp(newOtp);

    if (value && i < 3) {
      inputs.current[i + 1].focus();
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1].focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center mt-4">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          value={digit}
          maxLength={1}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-14 h-14 text-xl text-center bg-[#11141a] border border-[#2a2f3a] text-white rounded-xl"
        />
      ))}
    </div>
  );
}