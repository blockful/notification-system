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

function CustomTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
  valueLabel?: string;
}) {
  if (active && payload && payload.length > 0) {
    const value = payload[0].value;
    const formattedValue =
      typeof value === 'number' ? value.toLocaleString() : String(value);

    return (
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '8px 12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '4px' }}>
          {label}
        </p>
        <p style={{ color: '#38bdf8', fontWeight: 500, fontSize: '14px' }}>
          {valueLabel || 'Count'}: {formattedValue}
        </p>
      </div>
    );
  }

  return null;
}

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
              angle={forceAllTicks ? -45 : 0}
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
              content={<CustomTooltip valueLabel={valueLabel} />}
              cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }}
            />
            <Bar dataKey={barKey} fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
