"use client";

import Link from "next/link";
import { ArrowRight, Play, Sparkles, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const floatingCards = [
  {
    icon: Sparkles,
    label: "AI Insight",
    value: "Gợi ý thông minh",
    className: "left-[4%] top-[18%] hidden sm:flex",
    delay: 0,
  },
  {
    icon: Users,
    label: "Cộng đồng",
    value: "500+ học sinh",
    className: "right-[6%] top-[22%] hidden md:flex",
    delay: 0.15,
  },
  {
    icon: Zap,
    label: "Dự án",
    value: "35 đã triển khai",
    className: "bottom-[28%] left-[8%] hidden lg:flex",
    delay: 0.3,
  },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.75_0.12_264/0.35),transparent_55%)]" />
      <div className="pointer-events-none absolute top-20 right-[-10%] size-[420px] rounded-full bg-[oklch(0.75_0.14_300/0.25)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[-8%] size-[360px] rounded-full bg-[oklch(0.7_0.15_264/0.2)] blur-3xl" />

      <Container className="relative">
        {floatingCards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + card.delay }}
            className={cn(
              "absolute z-0 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-lg shadow-primary/10 backdrop-blur-xl",
              card.className,
            )}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4 + card.delay * 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <card.icon className="size-5" />
            </motion.div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-sm font-semibold text-foreground">{card.value}</p>
            </div>
          </motion.div>
        ))}

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-4 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-md"
          >
            <Sparkles className="size-3.5" />
            Nền tảng đổi mới giáo dục cho học sinh
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Biến ý tưởng cộng đồng{" "}
            <span className="bg-gradient-to-r from-primary to-[oklch(0.55_0.18_300)] bg-clip-text text-transparent">
              thành dự án thật
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Nền tảng nơi học sinh phát hiện vấn đề, cùng thảo luận, xây
            proposal bằng AI và triển khai thành dự án thực tế.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-11 w-full rounded-full px-8 shadow-lg shadow-primary/25 sm:w-auto">
              <Link href="#features">
                Khám phá
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 w-full rounded-full border-border/80 bg-white/60 px-8 backdrop-blur-md sm:w-auto"
            >
              <Link href="/dashboard">
                <Play className="size-4 fill-primary text-primary" />
                Xem Demo
              </Link>
            </Button>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
