export function DashboardLoading({ label = "Loading dashboard..." }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500" role="status">
      {label}
    </div>
  );
}

export function DashboardError({
  onRetry,
  message = "Could not load dashboard data.",
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white p-6">
      <p className="text-sm font-medium text-rose-800">{message}</p>
      <button
        className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
