"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectProps<T extends string> {
  label: string;
  options: readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  getLabel: (value: T) => string;
  placeholder?: string;
  disabled?: boolean;
}

export default function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
  getLabel,
  placeholder = "Chọn...",
  disabled = false,
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOption = (value: T) => {
    onChange(selected.filter((s) => s !== value));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex min-h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex flex-wrap gap-1.5">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  <span>{getLabel(value)}</span>
                  {!disabled && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          removeOption(value);
                        }
                      }}
                      className="ml-0.5 inline-flex cursor-pointer items-center justify-center rounded-sm p-0.5 hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </span>
              ))
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-input bg-background shadow-lg">
            <div className="max-h-60 overflow-auto p-1">
              {options.map((value) => {
                const isSelected = selected.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleOption(value)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
                      isSelected ? "bg-primary/5 text-primary" : "text-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-input"
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {getLabel(value)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}