"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  avatar: string;
  name: string;
  role: string;
  quote: string;
  avatarColor?: string;
  className?: string;
}

export function TestimonialCard({ avatar, name, role, quote, avatarColor = "bg-primary/10 text-primary", className }: TestimonialCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg",
        className
      )}
    >
      {/* Quote decoration */}
      <Quote className="absolute top-4 right-4 size-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
      
      <div className="mb-4 flex items-center gap-4">
        <div className={cn("flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold shadow-md", avatarColor)}>
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
      <blockquote className="text-sm leading-relaxed text-muted-foreground">
        "{quote}"
      </blockquote>
    </motion.article>
  );
}
