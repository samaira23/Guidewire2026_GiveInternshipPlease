import { useState } from "react";

export default function RiskControls({ setPremium }) {
  const [rain, setRain] = useState(false);
  const [overtime, setOvertime] = useState(false);

  const calculatePremium = (r, o) => {
    let base = 1200;
    if (r) base += 50;
    if (o) base += 40;
    setPremium(base);
  };

  return (
    <div className="bg-[#1a1d24] p-6 rounded-2xl shadow mt-4">
      <h2 className="font-semibold mb-4 text-lg">
        Simulate Risk Factors
      </h2>

      <div className="flex gap-6 text-lg">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            onChange={(e) => {
              const newVal = e.target.checked;
              setRain(newVal);
              calculatePremium(newVal, overtime);
            }}
          />
          Rain Risk
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            onChange={(e) => {
              const newVal = e.target.checked;
              setOvertime(newVal);
              calculatePremium(rain, newVal);
            }}
          />
          Overtime Work
        </label>
      </div>
    </div>
  );
}