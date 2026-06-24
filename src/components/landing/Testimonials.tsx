"use client";

import { Container } from "@/components/layout/container";
import { SectionHeader } from "./SectionHeader";
import { TestimonialCard } from "./TestimonialCard";

const testimonials = [
  {
    avatar: "TH",
    name: "Trần Hương",
    role: "Học sinh lớp 11",
    quote: "Nền tảng này đã giúp tôi biến ý tưởng về dự án tái chế thành hiện thực. AI Mentor đã hướng dẫn tôi từng bước.",
    avatarColor: "bg-primary/10 text-primary",
  },
  {
    avatar: "NL",
    name: "Nguyễn Long",
    role: "Giáo viên hướng dẫn",
    quote: "Tôi thấy học sinh của mình trở nên chủ động hơn và có kỹ năng giải quyết vấn đề tốt hơn sau khi sử dụng nền tảng.",
    avatarColor: "bg-secondary/10 text-secondary",
  },
  {
    avatar: "PM",
    name: "Phạm Mai",
    role: "Học sinh lớp 10",
    quote: "Cộng đồng rất tích cực và hỗ trợ. Tôi đã học được nhiều từ các dự án của bạn khác.",
    avatarColor: "bg-accent/10 text-accent",
  },
] as const;

export function Testimonials() {
  return (
    <section className="bg-white py-12 sm:py-20" aria-label="Testimonials">
      <Container className="max-w-7xl">
        <SectionHeader
          badge="Câu chuyện"
          title="Cộng đồng nói gì về chúng tôi"
          description="Những chia sẻ từ học sinh và giáo viên đã trải nghiệm hành trình với Community Project Lab."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Testimonial cards">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.name}
              avatar={testimonial.avatar}
              name={testimonial.name}
              role={testimonial.role}
              quote={testimonial.quote}
              avatarColor={testimonial.avatarColor}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
