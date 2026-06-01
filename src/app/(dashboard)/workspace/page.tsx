import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const columns = [
  {
    title: "To Do",
    tasks: ["Research canal pollution data", "Draft volunteer signup form"],
  },
  {
    title: "In Progress",
    tasks: ["Design awareness posters", "Contact local waste authority"],
  },
  {
    title: "Done",
    tasks: ["Form project team", "Present problem to class"],
  },
] as const;

export default function WorkspacePage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Track tasks and collaborate on your active project.
      </p>

      <div className="grid gap-5 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column.title} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {column.tasks.length}
              </span>
            </div>
            {column.tasks.map((task) => (
              <Card
                key={task}
                className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium leading-snug">
                    {task}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Canal Cleanup Project</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
