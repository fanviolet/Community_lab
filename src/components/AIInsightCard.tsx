"use client";

import { motion } from "framer-motion";
import {
     AlertTriangle,
     Lightbulb,
     Sparkles,
     Tag,
     Target,
     TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { useAIInsight } from "@/hooks/useAIInsight";
import type { AIInsight } from "@/types/ai-insight";

interface AIInsightCardProps {
     problemId: string;
     initialAiSummary?: string | null;
}

const urgencyClasses: Record<AIInsight["urgency"], string> = {
     low: "bg-emerald-100 text-emerald-800",
     medium: "bg-amber-100 text-amber-800",
     high: "bg-rose-100 text-rose-800",
};

export function AIInsightCard({ problemId, initialAiSummary }: AIInsightCardProps) {
     const { insight, loading, error, isGenerated, isAuthenticated, generateInsight } = useAIInsight(
          problemId,
          initialAiSummary,
     );

     const urgencyClass = insight ? urgencyClasses[insight.urgency] : urgencyClasses.low;

     return (
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
               <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-3">
                         <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20">
                              <Sparkles className="h-5 w-5" />
                         </div>
                         <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                                   Phân tích AI
                              </p>
                              <p className="text-lg font-semibold text-slate-900">Phân tích vấn đề cộng đồng này</p>
                         </div>
                    </div>

                    <PermissionGuard permission="insight.generate">
                         <Button
                              onClick={generateInsight}
                              disabled={loading || isGenerated || !isAuthenticated}
                              variant={isGenerated ? "secondary" : "default"}
                         >
                              {isGenerated ? "Đã tạo phân tích" : "Tạo phân tích AI"}
                         </Button>
                    </PermissionGuard>
               </div>

               {error ? (
                    <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                         <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4" />
                              <p>{error}</p>
                         </div>
                    </div>
               ) : null}

               {loading ? (
                    <div className="space-y-4 animate-pulse">
                         <div className="h-4 w-2/5 rounded-full bg-muted" />
                         <div className="grid gap-4">
                              <div className="h-20 rounded-3xl bg-muted" />
                              <div className="h-20 rounded-3xl bg-muted" />
                              <div className="h-20 rounded-3xl bg-muted" />
                         </div>
                    </div>
               ) : isGenerated && insight ? (
                    <motion.div
                         initial={{ opacity: 0, y: 16 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.35, ease: "easeOut" }}
                         className="space-y-6"
                    >
                         <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
                              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                   <div className="flex items-center gap-3 text-slate-600">
                                        <Target className="h-4 w-4" />
                                        <p className="text-sm font-semibold">Nguyên nhân gốc</p>
                                   </div>
                                   <p className="mt-4 text-sm leading-7 text-slate-900">{insight.rootCause}</p>
                              </div>

                              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                   <div className="flex items-center gap-3 text-slate-600">
                                        <TrendingUp className="h-4 w-4" />
                                        <p className="text-sm font-semibold">Tác động</p>
                                   </div>
                                   <p className="mt-4 text-sm leading-7 text-slate-900">{insight.impact}</p>
                              </div>
                         </div>

                         <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
                              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                   <div className="flex items-center gap-3 text-slate-600">
                                        <Lightbulb className="h-4 w-4" />
                                        <p className="text-sm font-semibold">Gợi ý</p>
                                   </div>
                                   <ol className="mt-4 space-y-3 text-sm text-slate-900">
                                        {insight.suggestions.map((suggestion, index) => (
                                             <li key={suggestion} className="flex gap-2">
                                                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                                                       {index + 1}
                                                  </span>
                                                  <span>{suggestion}</span>
                                             </li>
                                        ))}
                                   </ol>
                              </div>

                              <div className="space-y-4">
                                   <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3 text-slate-600">
                                             <Sparkles className="h-4 w-4" />
                                             <p className="text-sm font-semibold">Độ khẩn cấp</p>
                                        </div>
                                        <Badge className={`mt-4 ${urgencyClass}`}>{insight.urgency.toUpperCase()}</Badge>
                                   </div>

                                   <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3 text-slate-600">
                                             <Tag className="h-4 w-4" />
                                             <p className="text-sm font-semibold">Thẻ</p>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                             {insight.tags.map((tag) => (
                                                  <Badge key={tag} className="rounded-full bg-slate-100 text-slate-700">
                                                       {tag}
                                                  </Badge>
                                             ))}
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </motion.div>
               ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                         <p className="mb-3">Chưa tạo phân tích AI cho vấn đề này.</p>
                         <p className="text-xs text-slate-500">
                              Đăng nhập và nhấn nút ở trên để tạo tóm tắt có cấu trúc của vấn đề.
                         </p>
                    </div>
               )}

               {!isAuthenticated && !loading ? (
                    <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                         Đăng nhập để tạo phân tích AI cho vấn đề này.
                    </div>
               ) : null}

               <p className="mt-6 text-xs text-slate-500">Được tạo bởi AI. Được lưu trong cơ sở dữ liệu để tránh gọi lặp lại.</p>
          </section>
     );
}
