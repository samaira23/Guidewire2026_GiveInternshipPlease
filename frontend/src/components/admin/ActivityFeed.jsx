const FALLBACK_EVENTS = [
  "✔ Claim approved for ₹120",
  "✔ Premium recalculated",
  "✔ Rain alert triggered",
  "✔ Worker safety score updated",
];

export default function ActivityFeed({ events }) {
  const items = events || FALLBACK_EVENTS;

  return (
    <div className="bg-[#11141a] border border-[#2a2f3a] p-4 rounded-xl text-green-400 text-sm">
      {items.map((e, i) => (
        <p key={i} className="animate-pulse mb-1">
          &gt; {e}
        </p>
      ))}
    </div>
  );
}