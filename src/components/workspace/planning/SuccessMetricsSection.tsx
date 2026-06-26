"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SuccessMetricInput } from "@/types/planning-types";

interface SuccessMetricsSectionProps {
  value: SuccessMetricInput[];
  onChange: (value: SuccessMetricInput[]) => void;
  disabled?: boolean;
}

export default function SuccessMetricsSection({
  value,
  onChange,
  disabled = false,
}: SuccessMetricsSectionProps) {
  const addMetric = () => {
    onChange([...value, { metric: "", target: 0 }]);
  };

  const removeMetric = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, field: "metric" | "target", val: string | number) => {
    const updated = value.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Thước đo thành công</label>
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={addMetric}>
            <Plus className="mr-1 h-3 w-3" />
            Thêm
          </Button>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Chưa có thước đo nào. Nhấn "Thêm" để tạo thước đo thành công.
        </p>
      )}

      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3"
          >
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Tên thước đo (VD: registered_users)"
                value={item.metric}
                onChange={(e) => updateMetric(index, "metric", e.target.value)}
                disabled={disabled}
                className="h-9 text-sm"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">
                  Mục tiêu:
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="500"
                  value={item.target || ""}
                  onChange={(e) => updateMetric(index, "target", parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  className="h-9 w-32 text-sm"
                />
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeMetric(index)}
                className="mt-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}