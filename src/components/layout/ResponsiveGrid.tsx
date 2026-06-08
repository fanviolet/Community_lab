import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export function ResponsiveGrid({ children, className, cols }: ResponsiveGridProps) {
  const gridCols = cn(
    "grid gap-5",
    cols?.default || "grid-cols-1",
    cols?.sm || "sm:grid-cols-1",
    cols?.md || "md:grid-cols-2",
    cols?.lg || "lg:grid-cols-3",
    cols?.xl || "xl:grid-cols-4"
  );

  return (
    <div className={cn(gridCols, className)}>
      {children}
    </div>
  );
}
