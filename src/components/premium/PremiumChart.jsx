import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", premium: 1200 },
  { month: "Feb", premium: 1100 },
  { month: "Mar", premium: 1300 },
  { month: "Apr", premium: 1240 },
];

export default function PremiumChart() {
  return (
    <LineChart width={400} height={200} data={data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="premium" stroke="#2563eb" />
    </LineChart>
  );
}