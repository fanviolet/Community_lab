"use client";

import { useRBAC } from "@/contexts/rbac-context";
import { Badge } from "@/components/ui/badge";
import { t } from "@/hooks/useTranslation";

export function RoleBadge() {
  const { role } = useRBAC();

  const roleLabels: Record<string, string> = {
    admin: t("roles.admin") || "Quản trị viên",
    leader: t("roles.leader") || "Trưởng nhóm",
    mentor: t("roles.mentor") || "Cố vấn",
    expert: t("roles.expert") || "Chuyên gia",
    builder: t("roles.builder") || "Người xây dựng",
    member: t("roles.member") || "Thành viên",
    guest: t("roles.guest") || "Khách",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    leader: "bg-blue-100 text-blue-700",
    mentor: "bg-emerald-100 text-emerald-700",
    expert: "bg-amber-100 text-amber-700",
    builder: "bg-cyan-100 text-cyan-700",
    member: "bg-slate-100 text-slate-700",
    guest: "bg-gray-100 text-gray-700",
  };

  return (
    <Badge variant="outline" className={roleColors[role] || roleColors.member}>
      {roleLabels[role] || "Member"}
    </Badge>
  );
}
