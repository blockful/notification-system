'use client';

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type LineChartCardProps<T> = {
  title: string;
  data: T[];
  xKey: keyof T & string;
  lineKey: keyof T & string;
  valueLabel?: string;
};

export default function LineChartCard<T>({
  title,
  data,
  xKey,
  lineKey,
  valueLabel,
}: LineChartCardProps<T>) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#cbd5f5', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fill: '#cbd5f5', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(value: number) =>
                valueLabel ? [value, valueLabel] : [value, 'Count']
              }
            />
            <Line type="monotone" dataKey={lineKey} stroke="#38bdf8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
