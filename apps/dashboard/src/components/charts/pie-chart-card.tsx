'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type PieChartCardProps<T> = {
  title: string;
  data: T[];
  nameKey: keyof T & string;
  valueKey: keyof T & string;
};

const COLORS = ['#38bdf8', '#22c55e', '#facc15', '#f97316', '#a855f7'];

export default function PieChartCard<T>({
  title,
  data,
  nameKey,
  valueKey,
}: PieChartCardProps<T>) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={nameKey} outerRadius={80}>
              {data.map((_, index) => (
                <Cell key={`slice-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
