import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const FALLBACK_DATA = [
  { month: "Jan", premium: 1200 },
  { month: "Feb", premium: 1100 },
  { month: "Mar", premium: 1300 },
  { month: "Apr", premium: 1240 },
];

export default function PremiumChart({ history }) {
  const data = history && history.length > 0 ? history : FALLBACK_DATA;

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-blue-400 mb-4">Premium History</h2>
      <LineChart width={400} height={200} data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="premium" stroke="#2563eb" />
      </LineChart>
    </div>
  );
}