"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";

const stats = [
  { value: "120+", label: "vấn đề cộng đồng" },
  { value: "35", label: "dự án triển khai" },
  { value: "500+", label: "học sinh tham gia" },
] as const;

export function Stats() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <Container>
        <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Social Proof</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Được tin dùng bởi cộng đồng học sinh
          </h2>
          <p className="mt-4 text-muted-foreground">
            Community Project Lab đang giúp học sinh chuyển từ quan sát thực tế
            sang hành động có ý nghĩa — từng bước, từng dự án.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-5 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              className="rounded-2xl border border-white/80 bg-white/65 p-8 text-center shadow-sm backdrop-blur-xl transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
