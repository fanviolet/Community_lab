"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Users, FileText, Rocket, Heart } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeader } from "./SectionHeader";

const metrics = [
  { value: 120, label: "Vấn đề phát hiện", icon: TrendingUp, gradient: "from-primary to-violet-500" },
  { value: 85, label: "Proposal tạo ra", icon: FileText, gradient: "from-secondary to-cyan-500" },
  { value: 35, label: "Dự án triển khai", icon: Rocket, gradient: "from-accent to-emerald-500" },
  { value: 500, label: "Học sinh tham gia", icon: Users, gradient: "from-pink to-rose-500" },
  { value: 2500, label: "Người hưởng lợi", icon: Heart, gradient: "from-warning to-orange-500" },
] as const;

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}+</span>;
}

export function ImpactSection() {
  return (
    <section className="bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-900 py-12 sm:py-20" aria-label="Impact metrics">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 size-[600px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 size-[500px] rounded-full bg-accent/20 blur-3xl" />
      </div>
      
      <Container className="max-w-7xl relative z-10">
        <SectionHeader
          badge="Tác động"
          title="Tác động thực tế của cộng đồng"
          description="Những con số nói lên câu chuyện về sự thay đổi mà học sinh đang tạo ra."
          className="text-white"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl"
            >
              {/* Glowing icon */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -top-2 -right-2 flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${metric.gradient} opacity-50 blur-sm`}
              >
                <metric.icon className="size-6 text-white" />
              </motion.div>
              
              <div className={`relative z-10 mx-auto mb-3 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                <metric.icon className="size-7 text-white" />
              </div>
              
              <p className="relative z-10 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <AnimatedCounter value={metric.value} />
              </p>
              <p className="relative z-10 mt-2 text-sm text-white/80">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
