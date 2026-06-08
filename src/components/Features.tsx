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

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "Problem Discovery",
    description: "Khám phá và ghi nhận vấn đề cộng đồng từ góc nhìn học sinh.",
    icon: Search,
  },
  {
    title: "Community Discussion",
    description: "Thảo luận, bình chọn và làm rõ vấn đề cùng cộng đồng.",
    icon: MessageSquare,
  },
  {
    title: "AI Insight Engine",
    description: "AI phân tích dữ liệu và gợi ý hướng giải quyết phù hợp.",
    icon: Sparkles,
  },
  {
    title: "Project Workspace",
    description: "Quản lý tiến độ, nhiệm vụ và cộng tác trong workspace.",
    icon: LayoutDashboard,
  },
  {
    title: "Impact Archive",
    description: "Lưu trữ kết quả, bài học và tác động cho thế hệ sau.",
    icon: Archive,
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Tính năng</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Mọi thứ bạn cần để biến ý tưởng thành hành động
          </h2>
          <p className="mt-4 text-muted-foreground">
            Từ phát hiện vấn đề đến lưu trữ tác động — một hành trình liền mạch
            cho học sinh và giáo viên hướng dẫn.
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
