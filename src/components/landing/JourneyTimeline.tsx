"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { SectionHeader } from "./SectionHeader";

const steps = [
  {
    step: "01",
    title: "Khám phá",
    subtitle: "vấn đề",
    description: "Quan sát và ghi nhận các vấn đề cộng đồng từ góc nhìn học sinh.",
    gradient: "from-primary to-violet-500",
  },
  {
    step: "02",
    title: "Thảo luận",
    subtitle: "cộng đồng",
    description: "Cùng tranh luận, bình chọn và làm sâu hiểu biết chung.",
    gradient: "from-secondary to-cyan-500",
  },
  {
    step: "03",
    title: "AI",
    subtitle: "xây proposal",
    description: "AI gợi ý cấu trúc, nội dung và cải thiện đề xuất dự án.",
    gradient: "from-accent to-emerald-500",
  },
  {
    step: "04",
    title: "Triển khai",
    subtitle: "dự án",
    description: "Theo dõi tiến độ, phối hợp nhóm và đo lường tác động.",
    gradient: "from-pink to-rose-500",
  },
  {
    step: "05",
    title: "Đánh giá",
    subtitle: "tác động",
    description: "Đo lường kết quả và lưu trữ bài học cho thế hệ sau.",
    gradient: "from-warning to-orange-500",
  },
] as const;

export function JourneyTimeline() {
  return (
    <section className="bg-white py-12 sm:py-20" aria-label="Journey timeline">
      <Container className="max-w-7xl">
        <SectionHeader
          badge="Hành trình"
          title="Từ ý tưởng đến tác động"
          description="Quy trình 5 bước được thiết kế cho học sinh — đơn giản, có cấu trúc và dẫn dắt từ ý tưởng đến tác động thực tế."
        />

        {/* Desktop: Horizontal Timeline */}
        <div className="mt-12 hidden lg:block">
          <div className="relative">
            {/* Animated Horizontal Line */}
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute left-0 right-0 top-8 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent"
              aria-hidden="true"
            />
            
            <div className="grid grid-cols-5 gap-4" role="list" aria-label="Journey steps">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative"
                  role="listitem"
                >
                  {/* Step Number with Gradient */}
                  <div className={`relative z-10 mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-sm font-bold text-white shadow-lg transition-transform duration-300 hover:scale-110`}>
                    {item.step}
                  </div>
                  
                  {/* Content */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="mt-6 rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <h3 className="text-base font-semibold text-foreground">
                      {item.title} <span className="text-muted-foreground">{item.subtitle}</span>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile & Tablet: Vertical Timeline */}
        <div className="mt-12 lg:hidden">
          <div className="relative space-y-6">
            {/* Animated Vertical Line */}
            <motion.div 
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent"
              aria-hidden="true"
            />
            
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                className="relative flex gap-4"
                role="listitem"
              >
                {/* Step Number with Gradient */}
                <div className={`relative z-10 flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-sm font-bold text-white shadow-lg transition-transform duration-300 hover:scale-110`}>
                  {item.step}
                </div>
                
                {/* Content */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex-1 rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title} <span className="text-muted-foreground">{item.subtitle}</span>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
