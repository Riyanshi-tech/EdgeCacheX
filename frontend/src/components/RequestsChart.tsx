import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type DataPoint = {
  time: string;
  count: number;
};

export default function RequestsChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md mt-6">
      <h2 className="text-lg font-semibold mb-4">
        Requests Over Time
      </h2>

      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" />
      </LineChart>
    </div>
  );
}