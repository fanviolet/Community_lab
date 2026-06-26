export default function WorkspaceProjectLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-10 w-full max-w-3xl rounded-lg bg-muted" />
      <div className="h-96 rounded-xl bg-muted" />
    </div>
  );
}
