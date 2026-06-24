"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { SectionHeader } from "./SectionHeader";
import { ProjectCard } from "./ProjectCard";

const projects = [
  {
    category: "Môi trường",
    title: "Dự án tái chế rác thải nhựa",
    description: "Thu gom và tái chế rác thải nhựa tại trường học, tạo ra sản phẩm hữu ích.",
    membersCount: "15 thành viên",
    impactMetric: "500kg rác tái chế",
    likes: "42",
    progress: "75%",
  },
  {
    category: "Giáo dục",
    title: "Lớp học miễn phí cho trẻ em",
    description: "Tổ chức các lớp học bổ sung miễn phí cho trẻ em khu vực lân cận.",
    membersCount: "20 thành viên",
    impactMetric: "100 học sinh",
    likes: "38",
    progress: "90%",
  },
  {
    category: "Sức khỏe",
    title: "Chiến dịch vệ sinh cộng đồng",
    description: "Tổ chức các hoạt động vệ sinh và tuyên truyền về sức khỏe cộng đồng.",
    membersCount: "12 thành viên",
    impactMetric: "3 khu vực",
    likes: "25",
    progress: "60%",
  },
  {
    category: "Công nghệ",
    title: "Ứng dụng hỗ trợ học tập",
    description: "Phát triển ứng dụng giúp học sinh quản lý thời gian và tài liệu học tập.",
    membersCount: "8 thành viên",
    impactMetric: "200+ người dùng",
    likes: "56",
    progress: "85%",
  },
] as const;

export function FeaturedProjects() {
  return (
    <section id="featured-projects" className="bg-slate-50 py-12 sm:py-20" aria-label="Featured projects">
      <Container className="max-w-7xl">
        <SectionHeader
          badge="Dự án nổi bật"
          title="Dự án đang tạo tác động"
          description="Khám phá các dự án cộng đồng do học sinh triển khai và đang tạo ra sự thay đổi thực tế."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Project cards">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.title}
              category={project.category}
              title={project.title}
              description={project.description}
              membersCount={project.membersCount}
              impactMetric={project.impactMetric}
              likes={project.likes}
              progress={project.progress}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
