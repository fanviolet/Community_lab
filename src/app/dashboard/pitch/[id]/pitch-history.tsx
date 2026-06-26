import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PitchHistoryWithUser } from "@/types/pitch-management";

interface PitchHistoryProps {
  history: PitchHistoryWithUser[];
}

const actionLabels: Record<string, string> = {
  created: "Đã tạo",
  updated: "Đã cập nhật",
  submitted: "Đã gửi",
  reviewed: "Đã xem xét",
  status_changed: "Thay đổi trạng thái",
};

const statusLabels: Record<string, string> = {
  draft: "Bản nháp",
  submitted: "Đã gửi",
  under_review: "Đang xem xét",
  revision_required: "Cần chỉnh sửa",
  approved: "Đã phê duyệt",
  rejected: "Đã từ chối",
  converted: "Đã chuyển đổi",
};

export function PitchHistory({ history }: PitchHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Chưa có lịch sử hoạt động.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusValue = (value: any): string | null => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value !== null && 'status' in value) {
      return value.status as string;
    }
    return null;
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Lịch sử Xem Xét</CardTitle>
        <CardDescription>Theo dõi tất cả các thay đổi và cập nhật</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={item.user?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {item.user?.display_name?.charAt(0) || item.user?.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium">
                    {item.user?.display_name || item.user?.email}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {actionLabels[item.action] || item.action.replace("_", " ")}
                  </Badge>
                  {item.action === "status_changed" && item.new_value && (() => {
                    const statusValue = getStatusValue(item.new_value);
                    return statusValue ? (
                      <Badge variant="secondary" className="text-xs">
                        {statusLabels[statusValue] || statusValue}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString("vi-VN")}
                </p>
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
