"use client";

import MultiSelect from "./MultiSelect";
import type { Deliverable } from "@/types/planning-types";
import { DELIVERABLE_OPTIONS, getDeliverableLabel } from "@/types/planning-types";

interface DeliverablesSectionProps {
  value: Deliverable[];
  onChange: (value: Deliverable[]) => void;
  disabled?: boolean;
}

export default function DeliverablesSection({
  value,
  onChange,
  disabled = false,
}: DeliverablesSectionProps) {
  return (
    <MultiSelect<Deliverable>
      label="Sản phẩm bàn giao (Deliverables)"
      options={DELIVERABLE_OPTIONS}
      selected={value}
      onChange={onChange}
      getLabel={getDeliverableLabel}
      placeholder="Chọn sản phẩm bàn giao..."
      disabled={disabled}
    />
  );
}