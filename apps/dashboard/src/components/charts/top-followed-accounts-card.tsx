'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type TopFollowedAccount = {
  address: string;
  followerCount: number;
  ens: string | null;
};

type TopFollowedAccountsCardProps = {
  data: TopFollowedAccount[];
};

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CopyableAddress({ address, ens }: { address: string; ens: string | null }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API may not be available
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${address}`}
      className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs text-muted hover:bg-white/5 hover:text-text transition-colors"
    >
      <span className="font-mono">{ens ?? truncateAddress(address)}</span>
      <span className="text-[10px] opacity-60">
        {copied ? '✓' : '⧉'}
      </span>
    </button>
  );
}

export default function TopFollowedAccountsCard({ data }: TopFollowedAccountsCardProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: item.ens ?? truncateAddress(item.address),
  }));

  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-text">Top followed accounts</h3>
      <div className="mt-4 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#cbd5f5', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
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
              labelFormatter={(_label, payload) => {
                if (!payload?.[0]) return _label;
                const item = payload[0].payload as (typeof chartData)[number];
                return item.ens ? `${item.ens} (${truncateAddress(item.address)})` : item.address;
              }}
              formatter={(value: number) => [value, 'Followers']}
            />
            <Bar dataKey="followerCount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {data.map((item) => (
            <CopyableAddress key={item.address} address={item.address} ens={item.ens} />
          ))}
        </div>
      )}
    </div>
  );
}
