export default function ExplainAI({ explainData }) {
  const weather = explainData?.weather || 'Heavy rainfall';
  const location = explainData?.location || 'Zone 3';
  const historical = explainData?.historical || 'Medium';
  const decision = explainData?.decision || 'Increase premium + trigger claim';

  return (
    <div className="bg-[#11141a] border border-[#2a2f3a] p-4 rounded-xl text-sm">
      <p className="text-green-400">&gt; Model Inputs:</p>
      <p>• Weather API: {weather}</p>
      <p>• Worker Location: {location}</p>
      <p>• Historical Risk: {historical}</p>
      <p className="text-blue-400 mt-2">→ Decision: {decision}</p>
    </div>
  );
}