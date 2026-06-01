export function EnvConfigAlert() {
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">Supabase chưa được cấu hình</p>
      <p className="mt-1 text-amber-800">
        Sao chép <code className="font-mono text-xs">.env.local.example</code> thành{" "}
        <code className="font-mono text-xs">.env.local</code>, điền{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> và{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, rồi
        chạy lại <code className="font-mono text-xs">npm run dev</code>.
      </p>
    </div>
  );
}
