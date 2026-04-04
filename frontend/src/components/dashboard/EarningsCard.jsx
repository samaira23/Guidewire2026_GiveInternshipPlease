export default function EarningsCard({ earnings }) {
  const amount = earnings ?? 3240;

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-green-400 mb-2">Earnings Protected</h2>
      <p className="text-2xl font-bold">₹{Number(amount).toLocaleString('en-IN')}</p>
      <p className="text-sm text-gray-400">Covered this month</p>
    </div>
  );
}