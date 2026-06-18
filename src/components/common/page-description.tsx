import { cn } from "@/lib/utils";

interface PageDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageDescription({ children, className }: PageDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground leading-6", className)}>
      {children}
    </p>
  );
}
