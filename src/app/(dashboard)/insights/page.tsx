import { Sparkles, AlertCircle, TrendingUp, Lightbulb, Tag } from "lucide-react";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── helpers ──────────────────────────────────────────────────────────────────

interface AIInsight {
  rootCause: string;
  impact: string;
  suggestions: string[];
  urgency: "low" | "medium" | "high";
  tags: string[];
}

interface InsightRow {
  id: string;
  title: string;
  insight: AIInsight;
  generatedAt: string;
}

function parseInsight(raw: unknown): AIInsight | null {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    if (
      typeof p.rootCause === "string" &&
      typeof p.impact === "string" &&
      Array.isArray(p.suggestions) &&
      (p.urgency === "low" || p.urgency === "medium" || p.urgency === "high") &&
      Array.isArray(p.tags)
    ) {
      return p as unknown as AIInsight;
    }
    return null;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const urgencyConfig = {
  high: {
    label: "High urgency",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-red-200",
    border: "border-l-red-400",
  },
  medium: {
    label: "Medium urgency",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    border: "border-l-amber-400",
  },
  low: {
    label: "Low urgency",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    border: "border-l-emerald-400",
  },
};

// ── page ─────────────────────────────────────────────────────────────────────

export default async function InsightsPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: problems, error } = await supabase
    .from("problems")
    .select("id, title, ai_summary, ai_generated_at")
    .not("ai_summary", "is", null)
    .not("ai_generated_at", "is", null)
    .order("ai_generated_at", { ascending: false });

  const rows: InsightRow[] = [];

  if (Array.isArray(problems)) {
    for (const row of problems) {
      const insight = parseInsight(row.ai_summary);
      if (insight) {
        rows.push({
          id: String(row.id),
          title: String(row.title ?? "Untitled"),
          insight,
          generatedAt: String(row.ai_generated_at),
        });
      }
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            AI-generated analysis for community problems. Click a card to view
            the full problem.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
          <Sparkles className="size-3" />
          {rows.length} insight{rows.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          Failed to load insights. Please refresh the page.
        </div>
      )}

      {/* Empty state */}
      {!error && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <Sparkles className="size-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No insights yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Go to a problem and click &quot;Generate AI Insight&quot; to see
            analysis here.
          </p>
          <Link
            href="/dashboard/problems"
            className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-black/10 transition hover:shadow-md"
          >
            Browse Problems →
          </Link>
        </div>
      )}

      {/* Insight cards */}
      {rows.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => {
            const cfg = urgencyConfig[row.insight.urgency];
            return (
              <Link
                key={row.id}
                href={`/dashboard/problems/${row.id}`}
                className={`group block rounded-xl border border-l-4 bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cfg.border}`}
              >
                {/* Top row */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10">
                    <Sparkles className="size-3.5 text-violet-600" />
                  </div>
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cfg.badge}`}
                  >
                    <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mb-1 text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors line-clamp-2">
                  {row.title}
                </h3>
                <p className="mb-4 text-xs text-slate-400">
                  Generated {formatDate(row.generatedAt)}
                </p>

                {/* Root cause */}
                <div className="mb-3 flex gap-2">
                  <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Root cause
                    </p>
                    <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                      {row.insight.rootCause}
                    </p>
                  </div>
                </div>

                {/* Top suggestion */}
                {row.insight.suggestions[0] && (
                  <div className="mb-4 flex gap-2">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Top suggestion
                      </p>
                      <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {row.insight.suggestions[0]}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {row.insight.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag className="size-3 text-slate-300" />
                    {row.insight.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}