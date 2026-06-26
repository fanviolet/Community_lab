"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, DollarSign, Sparkles, Search, FileText, Rocket, Users } from "lucide-react";
import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MetricCard } from "./MetricCard";
import { t } from "@/hooks/useTranslation";

const stats = [
  { value: "120+", label: t("landing.hero.stats.problemsDiscovered"), icon: Search, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { value: "85", label: t("landing.hero.stats.proposalsCreated"), icon: FileText, iconColor: "text-secondary", iconBg: "bg-secondary/10" },
  { value: "35", label: t("landing.hero.stats.projectsDeployed"), icon: Rocket, iconColor: "text-accent", iconBg: "bg-accent/10" },
  { value: "500+", label: t("landing.hero.stats.studentsJoined"), icon: Users, iconColor: "text-pink", iconBg: "bg-pink/10" },
] as const;

const trustIndicators = [
  { icon: CheckCircle, label: t("landing.hero.trustIndicators.studentParticipated"), color: "text-accent" },
  { icon: DollarSign, label: t("landing.hero.trustIndicators.free"), color: "text-success" },
  { icon: Sparkles, label: t("landing.hero.trustIndicators.aiPowered"), color: "text-primary" },
] as const;

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-cyan-50 py-12 sm:py-20" aria-label="Hero section">
      {/* Background Glow Effects */}
      <div className="pointer-events-none absolute top-0 right-0 size-[500px] rounded-full bg-indigo-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 size-[400px] rounded-full bg-cyan-300/20 blur-3xl" />
      
      <Container className="max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Headline + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex flex-col justify-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Biến ý tưởng thành{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                {t("landing.hero.subtitle")}
              </span>
              <br />
              có tác động thật.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t("landing.hero.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="h-12 w-full rounded-2xl hover:scale-105 transition-transform sm:w-auto">
                <Link href="/dashboard">
                  {t("landing.hero.cta")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-2xl border-border hover:scale-105 transition-transform sm:w-auto"
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
              className="mt-8 flex flex-wrap gap-3"
              role="list"
              aria-label="Trust indicators"
            >
              {trustIndicators.map((indicator) => (
                <div
                  key={indicator.label}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-white/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm shadow-sm"
                  role="listitem"
                >
                  <indicator.icon className={`size-4 ${indicator.color}`} aria-hidden="true" />
                  <span>{indicator.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Statistics Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 flex items-center"
            aria-label="Statistics dashboard"
          >
            <div className="grid w-full gap-4 sm:grid-cols-2">
              {stats.map((stat, index) => (
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