"use client";

import type { ProjectType } from "@/types/planning-types";
import { PROJECT_TYPE_OPTIONS, PROJECT_TYPE_LABELS } from "@/types/planning-types";

interface ProjectTypeSelectProps {
  value: ProjectType | null;
  onChange: (value: ProjectType) => void;
  disabled?: boolean;
}

export default function ProjectTypeSelect({ value, onChange, disabled = false }: ProjectTypeSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Loại dự án</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as ProjectType)}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>
          Chọn loại dự án...
        </option>
        {PROJECT_TYPE_OPTIONS.map((type) => (
          <option key={type} value={type}>
            {PROJECT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
}