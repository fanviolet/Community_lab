export default function ReviewLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-1/3 rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-4 h-6 w-3/4 rounded-xl bg-muted" />
            <div className="mb-3 h-4 w-full rounded-xl bg-muted" />
            <div className="mb-5 h-4 w-5/6 rounded-xl bg-muted" />
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-24 rounded-xl bg-muted" />
              <div className="h-8 w-24 rounded-xl bg-muted" />
              <div className="h-8 w-24 rounded-xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
