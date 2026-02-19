import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CategoryChartProps {
  data: { category: string; count: number }[];
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function CategoryChart({ data }: CategoryChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        카테고리 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
          label={({ category, percent }) =>
            `${category} (${(percent * 100).toFixed(0)}%)`
          }
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}건`, '처리 수']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
