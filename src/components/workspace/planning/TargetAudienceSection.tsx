"use client";

import MultiSelect from "./MultiSelect";
import type { TargetAudience } from "@/types/planning-types";
import { TARGET_AUDIENCE_OPTIONS, getTargetAudienceLabel } from "@/types/planning-types";

interface TargetAudienceSectionProps {
  value: TargetAudience[];
  onChange: (value: TargetAudience[]) => void;
  disabled?: boolean;
}

export default function TargetAudienceSection({
  value,
  onChange,
  disabled = false,
}: TargetAudienceSectionProps) {
  return (
    <MultiSelect<TargetAudience>
      label="Đối tượng mục tiêu"
      options={TARGET_AUDIENCE_OPTIONS}
      selected={value}
      onChange={onChange}
      getLabel={getTargetAudienceLabel}
      placeholder="Chọn đối tượng..."
      disabled={disabled}
    />
  );
}