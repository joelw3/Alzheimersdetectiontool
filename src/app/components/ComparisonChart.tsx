import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ComparisonChartProps {
  immediateScore: number;
  delayedScore: number;
}

export function ComparisonChart({
  immediateScore,
  delayedScore,
}: ComparisonChartProps) {
  const data = [
    {
      name: "Immediate Recall",
      score: immediateScore,
      fill: "#10b981",
    },
    {
      name: "Delayed Recall",
      score: delayedScore,
      fill: "#f59e0b",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
        Score Comparison
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} label={{ value: "Score (%)", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="score" name="Score (%)" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
