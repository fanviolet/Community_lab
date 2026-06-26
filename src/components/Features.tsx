"use client";

import {
  Archive,
  LayoutDashboard,
  MessageSquare,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";
import { t } from "@/lib/translate";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: t("landing.features.items.problemDiscovery.title"),
    description: t("landing.features.items.problemDiscovery.description"),
    icon: Search,
  },
  {
    title: t("landing.features.items.communityDiscussion.title"),
    description: t("landing.features.items.communityDiscussion.description"),
    icon: MessageSquare,
  },
  {
    title: t("landing.features.items.aiInsightEngine.title"),
    description: t("landing.features.items.aiInsightEngine.description"),
    icon: Sparkles,
  },
  {
    title: t("landing.features.items.projectWorkspace.title"),
    description: t("landing.features.items.projectWorkspace.description"),
    icon: LayoutDashboard,
  },
  {
    title: t("landing.features.items.impactArchive.title"),
    description: t("landing.features.items.impactArchive.description"),
    icon: Archive,
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">{t("landing.features.badge")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("landing.features.description")}
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.article
              key={feature.title}
              variants={staggerItem}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={cn(
                "group rounded-2xl border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur-xl",
                "transition-shadow duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10",
              )}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent text-primary transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}