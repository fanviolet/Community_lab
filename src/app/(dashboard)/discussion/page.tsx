import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const threads = [
  {
    title: "How can we reduce cafeteria food waste?",
    author: "Minh T.",
    replies: 24,
    time: "2h ago",
    tag: "Sustainability",
  },
  {
    title: "Best approach for canal cleanup project?",
    author: "Lan N.",
    replies: 18,
    time: "5h ago",
    tag: "Environment",
  },
  {
    title: "Funding ideas for rural STEM kits",
    author: "Khoa P.",
    replies: 12,
    time: "1d ago",
    tag: "Education",
  },
  {
    title: "Partner schools for cross-community collab",
    author: "Anh L.",
    replies: 9,
    time: "2d ago",
    tag: "Community",
  },
  {
    title: "Measuring impact of mental health workshops",
    author: "Huyen D.",
    replies: 7,
    time: "3d ago",
    tag: "Wellbeing",
  },
] as const;

export default function DiscussionPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Discussion"
        description="Community threads — discuss, debate, and refine ideas together."
      />

      <div className="space-y-3">
        {threads.map((thread) => (
          <Card
            key={thread.title}
            className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-primary">{thread.tag}</span>
                <CardTitle className="mt-1 text-base leading-snug">
                  {thread.title}
                </CardTitle>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{thread.time}</span>
            </CardHeader>
            <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{thread.author}</span>
              <span>·</span>
              <span>{thread.replies} replies</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
