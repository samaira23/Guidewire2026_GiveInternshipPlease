import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const FALLBACK_DATA = [
  { day: "Mon", claims: 12 },
  { day: "Tue", claims: 18 },
  { day: "Wed", claims: 10 },
  { day: "Thu", claims: 22 },
  { day: "Fri", claims: 15 },
  { day: "Sat", claims: 8 },
  { day: "Sun", claims: 5 },
];

export default function ClaimsChart({ chartData }) {
  const data = chartData || FALLBACK_DATA;

  return (
    <div className="bg-[#1a1d24] border border-[#2a2f3a] p-6 rounded-xl">
      <h2 className="text-blue-400 mb-4">📊 Claim Analytics</h2>

      <LineChart width={400} height={200} data={data}>
        <XAxis dataKey="day" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Line type="monotone" dataKey="claims" stroke="#2563eb" />
      </LineChart>
    </div>
  );
}