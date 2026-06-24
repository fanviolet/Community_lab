"use client";

import { Users, TrendingUp, Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  category: string;
  title: string;
  description: string;
  membersCount: string;
  impactMetric: string;
  likes?: string;
  progress?: string;
  categoryColor?: string;
  className?: string;
}

const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
  "Môi trường": { bg: "bg-emerald-10", text: "text-emerald-600", gradient: "from-emerald-400 to-green-500" },
  "Giáo dục": { bg: "bg-blue-10", text: "text-blue-600", gradient: "from-blue-400 to-cyan-500" },
  "Sức khỏe": { bg: "bg-pink-10", text: "text-pink-600", gradient: "from-pink-400 to-rose-500" },
  "Công nghệ": { bg: "bg-purple-10", text: "text-purple-600", gradient: "from-purple-400 to-violet-500" },
};

export function ProjectCard({ category, title, description, membersCount, impactMetric, likes, progress, categoryColor, className }: ProjectCardProps) {
  const colors = categoryColors[category] || categoryColors["Công nghệ"];
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:shadow-xl",
        className
      )}
    >
      {/* Project Cover */}
      <div className={`h-24 bg-gradient-to-br ${colors.gradient} opacity-90`} />
      
      <div className="p-6">
        <div className="mb-4">
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", colors.bg, colors.text)}>
            {category}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        
        {/* Impact Indicators */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            <span>{membersCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3" />
            <span>{impactMetric}</span>
          </div>
          {likes && (
            <div className="flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs text-pink-600">
              <Heart className="size-3 fill-current" />
              <span>{likes}</span>
            </div>
          )}
        </div>
        
        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Tiến độ</span>
              <span>{progress}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: progress }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full bg-gradient-to-r ${colors.gradient}`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
