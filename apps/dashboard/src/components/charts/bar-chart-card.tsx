'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type BarChartCardProps<T> = {
  title: string;
  data: T[];
  xKey: keyof T & string;
  barKey: keyof T & string;
  valueLabel?: string;
  forceAllTicks?: boolean;
};

export default function BarChartCard<T>({
  title,
  data,
  xKey,
  barKey,
  valueLabel,
  forceAllTicks = false,
}: BarChartCardProps<T>) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
            <XAxis
              dataKey={xKey}
              type="category"
              allowDuplicatedCategory={false}
              interval={forceAllTicks ? 0 : 'preserveEnd'}
              angle={forceAllTicks ? -30 : 0}
              textAnchor={forceAllTicks ? 'end' : 'middle'}
              height={forceAllTicks ? 50 : 30}
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
            <Bar dataKey={barKey} fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
