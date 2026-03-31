export default function ActivityFeed() {
  const events = [
    "✔ Claim approved for ₹120",
    "✔ Premium recalculated",
    "✔ Rain alert triggered",
    "✔ Worker safety score updated",
  ];

  return (
    <div className="bg-[#11141a] border border-[#2a2f3a] p-4 rounded-xl text-green-400 text-sm">
      {events.map((e, i) => (
        <p key={i} className="animate-pulse">
          &gt; {e}
        </p>
      ))}
    </div>
  );
}