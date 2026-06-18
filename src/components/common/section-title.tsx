import { cn } from "@/lib/utils";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h2 className={cn("text-2xl font-semibold tracking-tight", className)}>
      {children}
    </h2>
  );
}

export function SubsectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h3 className={cn("text-xl font-semibold tracking-tight", className)}>
      {children}
    </h3>
  );
}
