export default function ExplainAI() {
  return (
    <div className="bg-[#11141a] border border-[#2a2f3a] p-4 rounded-xl text-sm">
      <p className="text-green-400">
        &gt; Model Inputs:
      </p>
      <p>• Weather API: Heavy rainfall</p>
      <p>• Worker Location: Zone 3</p>
      <p>• Historical Risk: Medium</p>

      <p className="text-blue-400 mt-2">
        → Decision: Increase premium + trigger claim
      </p>
    </div>
  );
}