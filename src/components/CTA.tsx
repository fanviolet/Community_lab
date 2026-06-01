"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/motion";

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <motion.div
          {...fadeInUp}
          className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-primary via-[oklch(0.5_0.18_280)] to-[oklch(0.55_0.16_300)] px-6 py-16 text-center shadow-2xl shadow-primary/25 sm:px-12 sm:py-20"
        >
          <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Xây thế hệ tạo ra thay đổi
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-white/85 sm:text-base">
              Tham gia ngay hôm nay — bắt đầu từ một vấn đề nhỏ, tạo ra tác
              động lớn cho cộng đồng xung quanh bạn.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-11 rounded-full bg-white px-8 text-primary shadow-lg hover:bg-white/90"
            >
              <Link href="/dashboard">
                Bắt đầu ngay
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
