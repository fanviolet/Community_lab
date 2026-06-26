"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  Sparkles,
  Search,
  FileText,
  Rocket,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MetricCard } from "./MetricCard";
import { t } from "@/hooks/useTranslation";

const stats = [
  {
    value: "120+",
    label: t("landing.hero.stats.problemsDiscovered"),
    icon: Search,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    value: "85",
    label: t("landing.hero.stats.proposalsCreated"),
    icon: FileText,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
  },
  {
    value: "35",
    label: t("landing.hero.stats.projectsDeployed"),
    icon: Rocket,
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
  },
  {
    value: "500+",
    label: t("landing.hero.stats.studentsJoined"),
    icon: Users,
    iconColor: "text-pink",
    iconBg: "bg-pink/10",
  },
] as const;

const trustIndicators = [
  {
    icon: CheckCircle,
    label: t("landing.hero.trustIndicators.studentParticipated"),
    color: "text-accent",
  },
  {
    icon: DollarSign,
    label: t("landing.hero.trustIndicators.free"),
    color: "text-success",
  },
  {
    icon: Sparkles,
    label: t("landing.hero.trustIndicators.aiPowered"),
    color: "text-primary",
  },
] as const;

export function LandingHero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-cyan-50 py-16 lg:py-24"
      aria-label="Hero section"
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-300/20 blur-3xl" />

      <Container className="max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Biến ý tưởng thành
              <br />

              <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                dự án cộng đồng
              </span>

              <br />

              có tác động thật.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground"
            >
              Nền tảng giúp học sinh phát hiện vấn đề, cùng thảo luận, xây dựng
              proposal với AI và triển khai thành những dự án tạo tác động tích
              cực cho cộng đồng.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="h-12 rounded-2xl px-8 transition-transform hover:scale-105"
              >
                <Link href="/dashboard">
                  {t("landing.hero.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-2xl px-8 transition-transform hover:scale-105"
              >
                <Link href="#featured-projects">
                  {t("landing.hero.explore")}
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              {trustIndicators.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-white/70 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur"
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 flex items-center"
          >
            <div className="grid w-full gap-5 sm:grid-cols-2">
              {stats.map((stat) => (
                <MetricCard
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  icon={stat.icon}
                  iconColor={stat.iconColor}
                  iconBg={stat.iconBg}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}