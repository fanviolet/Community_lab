"use client";

import { Bot, Lightbulb, Target, FileText, Users, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "./SectionHeader";

const actionChips = [
  { icon: Lightbulb, label: "Phân tích nguyên nhân", color: "bg-primary/10 text-primary hover:bg-primary/20" },
  { icon: Target, label: "Gợi ý giải pháp", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
  { icon: Target, label: "Đặt mục tiêu SMART", color: "bg-accent/10 text-accent hover:bg-accent/20" },
  { icon: FileText, label: "Viết proposal", color: "bg-pink/10 text-pink hover:bg-pink/20" },
  { icon: Users, label: "Đề xuất nguồn lực", color: "bg-warning/10 text-warning hover:bg-warning/20" },
] as const;

export function AIMentorSection() {
  return (
    <section className="bg-gradient-to-r from-indigo-50 to-cyan-50 py-12 sm:py-20" aria-label="Trợ lý dự án AI">
      <Container className="max-w-7xl">
        <SectionHeader
          badge="Trợ lý dự án AI"
          title="Trợ lý AI thông minh hỗ trợ dự án của bạn"
          description="Nhận hướng dẫn cá nhân hóa từ AI để phát hiện vấn đề, xây đề xuất và triển khai dự án thành công."
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          {/* Left: Product Illustration Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="relative">
              {/* Floating shapes */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-8 -left-8 size-16 rounded-full bg-primary/20 blur-xl"
              />
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -right-8 size-20 rounded-full bg-cyan-300/30 blur-xl"
              />
              
              <div className="relative flex size-64 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-cyan-100 shadow-lg sm:size-80">
                <Bot className="size-32 text-primary sm:size-40" aria-hidden="true" />
              </div>
              
              {/* Floating AI Badge */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md"
              >
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Được hỗ trợ bởi AI</span>
              </motion.div>
              
              <div className="absolute -bottom-4 -right-4 flex size-20 items-center justify-center rounded-2xl bg-white shadow-lg sm:size-24">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary sm:text-3xl">24/7</p>
                  <p className="text-xs text-muted-foreground">Hỗ trợ</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: AI Mentor Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-lg backdrop-blur-xl sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <span className="text-sm font-medium text-primary">Trạng thái AI: Đang hỗ trợ hơn 2.500 học sinh</span>
              </div>
              
              <h3 className="text-lg font-semibold text-foreground">
                Bạn muốn giải quyết vấn đề gì?
              </h3>
              
              <div className="mt-4">
                <Input
                  placeholder="Mô tả vấn đề bạn quan tâm..."
                  className="h-12 rounded-2xl border-border bg-white/50 backdrop-blur-sm"
                  aria-label="Mô tả vấn đề bạn quan tâm"
                />
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  Hoặc chọn hành động:
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="AI action chips">
                  {actionChips.map((chip) => (
                    <motion.button
                      key={chip.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200 ${chip.color}`}
                      aria-label={chip.label}
                    >
                      <chip.icon className="size-4" aria-hidden="true" />
                      {chip.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <Button className="mt-6 h-12 w-full rounded-2xl hover:scale-105 transition-transform">
                Bắt đầu với trợ lý AI
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
