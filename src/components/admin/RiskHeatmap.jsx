export default function RiskHeatmap() {
  const zones = [
    { name: "Zone 1", risk: "low" },
    { name: "Zone 2", risk: "medium" },
    { name: "Zone 3", risk: "high" },
  ];

  const getColor = (risk) => {
    if (risk === "low") return "bg-green-500";
    if (risk === "medium") return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-yellow-400 mb-4">🗺 Risk Heatmap</h2>

      <div className="grid grid-cols-3 gap-4">
        {zones.map((z, i) => (
          <div
            key={i}
            className={`${getColor(z.risk)} p-6 rounded text-black text-center`}
          >
            {z.name}
          </div>
        ))}
      </div>
    </div>
  );
}