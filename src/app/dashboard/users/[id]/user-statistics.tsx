"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Users, CheckCircle, MessageSquare, ThumbsUp } from "lucide-react";

interface UserStatisticsProps {
  statistics: any;
}

export function UserStatistics({ statistics }: UserStatisticsProps) {
  const stats = [
    {
      label: "Vấn đề đã tạo",
      value: statistics?.problems_created || 0,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Vấn đề đã giải quyết",
      value: statistics?.problems_solved || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Dự án đã tham gia",
      value: statistics?.projects_joined || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      label: "Dự án đã dẫn dắt",
      value: statistics?.projects_led || 0,
      icon: Users,
      color: "text-indigo-600",
    },
    {
      label: "Nhiệm vụ đã hoàn thành",
      value: statistics?.tasks_completed || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
    },
    {
      label: "Lượt đánh giá đã hoàn thành",
      value: statistics?.reviews_completed || 0,
      icon: FileText,
      color: "text-orange-600",
    },
    {
      label: "Bình luận",
      value: statistics?.comments_count || 0,
      icon: MessageSquare,
      color: "text-cyan-600",
    },
    {
      label: "Lượt bình chọn",
      value: statistics?.votes_cast || 0,
      icon: ThumbsUp,
      color: "text-pink-600",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Thống kê người dùng
          </CardTitle>
          <CardDescription>
            Tổng quan hoạt động và đóng góp của người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {statistics?.last_activity_at && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Dòng thời gian hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hoạt động gần nhất:{" "}
              {new Date(statistics.last_activity_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
