import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PipelineStage {
  name: string;
  count: number;
  color: string;
}

interface CommunityPipelineProps {
  stages: PipelineStage[];
}

export function CommunityPipeline({ stages }: CommunityPipelineProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Dòng công việc cộng đồng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  {stage.name}
                </span>
                <Badge variant="secondary" className={stage.color}>
                  {stage.count}
                </Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stage.color.replace("text-", "bg-").replace("bg-", "bg-")}`}
                  style={{ width: `${(stage.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
