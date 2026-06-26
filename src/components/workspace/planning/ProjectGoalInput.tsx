"use client";

import { Textarea } from "@/components/ui/textarea";

interface ProjectGoalInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MIN_CHARS = 100;
const MAX_CHARS = 300;

export default function ProjectGoalInput({
  value,
  onChange,
  disabled = false,
}: ProjectGoalInputProps) {
  const charCount = value.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const isNearLimit = charCount >= MAX_CHARS * 0.9;

  const getStatusColor = () => {
    if (charCount === 0) return "text-muted-foreground";
    if (charCount < MIN_CHARS) return "text-amber-500";
    if (charCount > MAX_CHARS) return "text-destructive";
    return "text-green-600";
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Mục tiêu chính của dự án
        <span className="text-muted-foreground font-normal ml-1">
          ({MIN_CHARS}-{MAX_CHARS} ký tự)
        </span>
      </label>
      <Textarea
        placeholder="Mô tả mục tiêu duy nhất của dự án. VD: Xây dựng nền tảng giao tiếp cho học sinh THCS và THPT tham gia các dự án cộng đồng."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        className={`resize-none ${
          !isValid && charCount > 0
            ? "border-amber-300 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"
            : charCount > MAX_CHARS
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
              : ""
        }`}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {charCount === 0
            ? "Nhập mục tiêu chính của dự án"
            : charCount < MIN_CHARS
              ? `Cần thêm ${MIN_CHARS - charCount} ký tự nữa (tối thiểu ${MIN_CHARS})`
              : charCount <= MAX_CHARS
                ? "Đạt yêu cầu"
                : `Vượt quá ${MAX_CHARS} ký tự`}
        </p>
        <p className={`text-xs font-medium ${getStatusColor()} ${isNearLimit ? "font-semibold" : ""}`}>
          {charCount}/{MAX_CHARS}
        </p>
      </div>
    </div>
  );
}