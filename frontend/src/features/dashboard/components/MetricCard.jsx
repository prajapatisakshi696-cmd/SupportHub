export default function MetricCard({ label, value, icon: Icon, detail }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
        </div>
        <span className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800">
          <Icon aria-hidden="true" size={19} />
        </span>
      </div>
    </article>
  );
}
