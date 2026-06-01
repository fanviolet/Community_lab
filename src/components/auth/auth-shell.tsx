import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.75_0.12_264/0.35),transparent_55%)]" />
      <div className="pointer-events-none absolute top-20 right-[-10%] size-[420px] rounded-full bg-[oklch(0.75_0.14_300/0.2)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[-8%] size-[360px] rounded-full bg-[oklch(0.7_0.15_264/0.15)] blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          ← Community Project Lab
        </Link>

        <div className="rounded-3xl border border-white/70 bg-white/65 p-8 shadow-xl shadow-primary/10 backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
