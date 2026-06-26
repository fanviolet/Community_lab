import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface MemberContributionsProps {
  profileId: string;
}

export function MemberContributions({ profileId }: MemberContributionsProps) {
  // This would fetch contributions from the database
  // For now, showing a placeholder
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Đóng góp</CardTitle>
        <CardDescription>
          Theo dõi đóng góp qua dự án và hoạt động
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            Chưa có đóng góp nào được ghi nhận. Đóng góp sẽ được tự động ghi khi
            thành viên tham gia dự án.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
