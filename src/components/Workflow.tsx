"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";

const steps = [
  {
    step: "01",
    title: "Phát hiện vấn đề",
    description: "Học sinh quan sát, ghi nhận và ưu tiên vấn đề cộng đồng.",
  },
  {
    step: "02",
    title: "Thảo luận cộng đồng",
    description: "Cùng tranh luận, bình chọn và làm sâu hiểu biết chung.",
  },
  {
    step: "03",
    title: "AI hỗ trợ xây proposal",
    description: "AI gợi ý cấu trúc, nội dung và cải thiện đề xuất dự án.",
  },
  {
    step: "04",
    title: "Triển khai dự án",
    description: "Theo dõi tiến độ, phối hợp nhóm và đo lường tác động.",
  },
] as const;

export function Workflow() {
  return (
    <section
      id="workflow"
      className="bg-gradient-to-b from-accent/30 to-background py-20 sm:py-28"
    >
      <Container>
        <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Quy trình</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hành trình 4 bước rõ ràng
          </h2>
          <p className="mt-4 text-muted-foreground">
            Quy trình được thiết kế cho học sinh — đơn giản, có cấu trúc và dẫn
            dắt từ ý tưởng đến tác động thực tế.
          </p>
        </motion.div>

        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="relative mt-14 space-y-0"
        >
          <div className="absolute top-8 bottom-8 left-[1.65rem] hidden w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent sm:block" />

          {steps.map((item, index) => (
            <motion.li
              key={item.step}
              variants={staggerItem}
              className="relative flex gap-6 pb-10 last:pb-0 sm:gap-8"
            >
              <div className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-sm font-bold text-primary shadow-md backdrop-blur-xl">
                {item.step}
              </div>
              <div className="flex-1 rounded-2xl border border-white/70 bg-white/55 p-6 backdrop-blur-xl transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10 sm:p-8">
                <h3 className="text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.description}
                </p>
                {index < steps.length - 1 && (
                  <span className="mt-4 inline-block text-xs font-medium text-primary/70">
                    Bước tiếp theo →
                  </span>
                )}
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </section>
  );
}
