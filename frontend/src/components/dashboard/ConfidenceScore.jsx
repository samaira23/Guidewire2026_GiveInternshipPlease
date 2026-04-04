export default function ConfidenceScore({ score }) {
  const display = score ?? 87;

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-blue-400 mb-2">AI Confidence</h2>
      <p className="text-green-400 text-2xl font-bold">{display}%</p>
      <p className="text-gray-400 text-sm">Accuracy of disruption prediction</p>
    </div>
  );
}