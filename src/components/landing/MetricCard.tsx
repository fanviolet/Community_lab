"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  value: string;
  label: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function MetricCard({ value, label, icon: Icon, iconColor = "text-primary", iconBg = "bg-primary/10", className }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group rounded-2xl border border-border bg-white p-6 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20",
        className
      )}
    >
      {Icon && (
        <div className={cn("mx-auto mb-3 flex size-12 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("size-6", iconColor)} />
        </div>
      )}
      <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}
