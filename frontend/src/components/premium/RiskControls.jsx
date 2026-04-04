import { useState } from "react";
import { calculatePremium } from "../../api";

export default function RiskControls({ setPremium, setHistory }) {
  const [rain, setRain] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newRain, newOvertime) => {
    setLoading(true);
    try {
      const data = await calculatePremium(newRain, newOvertime);
      setPremium(data.premium);
      if (data.history && setHistory) {
        setHistory(data.history);
      }
    } catch {
      // Fallback to local calculation
      let base = 1200;
      if (newRain) base += 50;
      if (newOvertime) base += 40;
      setPremium(base);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1d24] p-6 rounded-2xl shadow mt-4">
      <h2 className="font-semibold mb-4 text-lg text-white">
        Simulate Risk Factors{loading && <span className="text-blue-400 text-sm ml-2">Calculating...</span>}
      </h2>

      <div className="flex gap-6 text-lg text-white">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rain}
            onChange={(e) => {
              const val = e.target.checked;
              setRain(val);
              handleChange(val, overtime);
            }}
          />
          🌧 Rain Risk (+₹50)
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={overtime}
            onChange={(e) => {
              const val = e.target.checked;
              setOvertime(val);
              handleChange(rain, val);
            }}
          />
          ⏰ Overtime Work (+₹40)
        </label>
      </div>
    </div>
  );
}