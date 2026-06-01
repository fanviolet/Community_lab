import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const projects = [
  {
    title: "School Garden Composting Program",
    year: "2025",
    impact: "Reduced cafeteria waste by 35%",
    team: "Green Team · 8 members",
  },
  {
    title: "Safe Crossing Awareness Campaign",
    year: "2025",
    impact: "Installed 2 new crosswalk signs",
    team: "Safety Squad · 6 members",
  },
  {
    title: "Rural STEM Kit Distribution",
    year: "2024",
    impact: "120 students reached across 3 schools",
    team: "STEM Collective · 10 members",
  },
  {
    title: "Senior Digital Literacy Workshops",
    year: "2024",
    impact: "45 seniors trained on basic apps",
    team: "Bridge Builders · 5 members",
  },
] as const;

export default function ArchivePage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Completed projects and their documented community impact.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <Card
            key={project.title}
            className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {project.year}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Completed
                </span>
              </div>
              <CardTitle className="mt-2 text-base leading-snug">
                {project.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{project.impact}</p>
              <p className="text-xs text-muted-foreground">{project.team}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
