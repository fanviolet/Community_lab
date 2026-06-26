export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-28 rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-muted lg:col-span-2" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
