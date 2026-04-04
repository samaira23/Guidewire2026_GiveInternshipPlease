export default function WeeklyCoverage({ coverage }) {
  const weekdays = coverage?.weekdays || 'Mon–Fri: Active';
  const weekends = coverage?.weekends || 'Weekend: Limited';

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-blue-400 mb-2">Weekly Coverage</h2>
      <p>{weekdays}</p>
      <p>{weekends}</p>
    </div>
  );
}