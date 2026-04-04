export default function ClaimTimeline({ status }) {
  const steps = ["Submitted", "Processing", "Approved", "Paid"];

  return (
    <div className="bg-[#1a1d24] p-6 rounded-2xl shadow">
      <h2 className="font-semibold mb-3">Claim Progress</h2>

      <div className="flex justify-between text-sm">
        {steps.map((step, i) => (
          <span
            key={i}
            className={i <= status ? "text-green-600" : "text-gray-400"}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}