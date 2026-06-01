import { Container } from "@/components/layout/container";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-white/50 py-10 backdrop-blur-md">
      <Container className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-semibold text-foreground">
          Community Project Lab
        </p>
        <p className="text-sm text-muted-foreground">
          Made for student-led innovation
        </p>
      </Container>
    </footer>
  );
}
