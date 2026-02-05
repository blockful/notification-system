'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  valueLabel = 'Value',
  forceAllTicks = false,
}: BarChartCardProps<T>) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <div className="mt-4 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data as Record<string, unknown>[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#cbd5f5', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              interval={forceAllTicks ? 0 : 'preserveStartEnd'}
              angle={forceAllTicks ? -45 : 0}
              textAnchor={forceAllTicks ? 'end' : 'middle'}
              height={forceAllTicks ? 60 : 30}
            />
            <YAxis
              tick={{ fill: '#cbd5f5', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px',
              }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
              itemStyle={{ color: '#94a3b8' }}
              formatter={(value: number) => [value, valueLabel]}
            />
            <Bar dataKey={barKey} fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
