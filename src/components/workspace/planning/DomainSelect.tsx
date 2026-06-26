"use client";

import type { ProjectDomain } from "@/types/planning-types";
import { DOMAIN_OPTIONS, DOMAIN_LABELS } from "@/types/planning-types";

interface DomainSelectProps {
  value: ProjectDomain | null;
  onChange: (value: ProjectDomain) => void;
  disabled?: boolean;
}

export default function DomainSelect({ value, onChange, disabled = false }: DomainSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Lĩnh vực dự án</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as ProjectDomain)}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>
          Chọn lĩnh vực...
        </option>
        {DOMAIN_OPTIONS.map((domain) => (
          <option key={domain} value={domain}>
            {DOMAIN_LABELS[domain]}
          </option>
        ))}
      </select>
    </div>
  );
}