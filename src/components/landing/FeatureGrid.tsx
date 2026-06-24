"use client";

import { Brain, Users, Heart, BookOpen } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeader } from "./SectionHeader";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    icon: Brain,
    title: "AI hỗ trợ thông minh",
    description: "AI phân tích dữ liệu và gợi ý hướng giải pháp phù hợp cho từng vấn đề.",
    gradient: "from-primary to-violet-500",
  },
  {
    icon: Users,
    title: "Cộng đồng toàn diện",
    description: "Kết nối học sinh, giáo viên và chuyên gia để cùng nhau giải quyết vấn đề.",
    gradient: "from-secondary to-cyan-500",
  },
  {
    icon: Heart,
    title: "Cộng đồng tích cực",
    description: "Môi trường học tập tích cực nơi mọi người được khuyến khích đóng góp.",
    gradient: "from-pink to-rose-500",
  },
  {
    icon: BookOpen,
    title: "Tài nguyên phong phú",
    description: "Thư viện tài liệu, template và hướng dẫn chi tiết cho mọi dự án.",
    gradient: "from-warning to-orange-500",
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="bg-white py-12 sm:py-20" aria-label="Platform features">
      <Container className="max-w-7xl">
        <SectionHeader
          badge="Tính năng nền tảng"
          title="Mọi thứ bạn cần để biến ý tưởng thành hành động"
          description="Từ phát hiện vấn đề đến lưu trữ tác động — một hành trình liền mạch cho học sinh và giáo viên hướng dẫn."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Feature cards">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
