'use client';

import type { TooltipProps } from 'recharts';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type BarChartTooltipProps = TooltipProps<number | string, string> & {
  valueLabel?: string;
};

function BarChartTooltip({ active, payload, label, valueLabel }: BarChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const displayValue =
    typeof entry.value === 'number' ? entry.value.toLocaleString() : String(entry.value ?? '');
  const displayLabel = valueLabel ?? entry.name ?? 'Count';

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-sm">
      <div className="font-medium text-slate-100">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-slate-400">{displayLabel}</span>
        <span className="font-semibold text-slate-100">{displayValue}</span>
      </div>
    </div>
  );
}

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
      <div className="mt-4 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
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
              cursor={{ fill: 'rgba(56, 189, 248, 0.12)' }}
              content={(props) => <BarChartTooltip {...props} valueLabel={valueLabel} />}
            />
            <Bar dataKey={barKey} fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
