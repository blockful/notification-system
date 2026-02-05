type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export default function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
    </div>
  );
}
