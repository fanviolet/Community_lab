import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PitchContent } from "@/types/pitch-management";

interface PitchProposalProps {
  content: PitchContent | null;
}

export function PitchProposal({ content }: PitchProposalProps) {
  if (!content) {
    return (
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            Chưa có nội dung đề xuất.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.project_summary && (
            <div>
              <h3 className="text-sm font-medium mb-2">Tóm tắt dự án</h3>
              <p className="text-sm text-muted-foreground">
                {content.project_summary}
              </p>
            </div>
          )}
          {content.target_audience && (
            <div>
              <h3 className="text-sm font-medium mb-2">Đối tượng mục tiêu</h3>
              <p className="text-sm text-muted-foreground">
                {content.target_audience}
              </p>
            </div>
          )}
          {content.key_objectives && content.key_objectives.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Mục tiêu chính</h3>
              <div className="space-y-1">
                {content.key_objectives.map((objective, index) => (
                  <Badge key={index} variant="outline">
                    {objective}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Phân tích vấn đề</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.problem_statement && (
            <div>
              <h3 className="text-sm font-medium mb-2">Mô tả vấn đề</h3>
              <p className="text-sm text-muted-foreground">
                {content.problem_statement}
              </p>
            </div>
          )}
          {content.root_cause_analysis && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Phân tích nguyên nhân gốc rễ
              </h3>
              <p className="text-sm text-muted-foreground">
                {content.root_cause_analysis}
              </p>
            </div>
          )}
          {content.problem_validation && (
            <div>
              <h3 className="text-sm font-medium mb-2">Xác thực vấn đề</h3>
              <p className="text-sm text-muted-foreground">
                {content.problem_validation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Thiết kế giải pháp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.solution_description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Mô tả giải pháp</h3>
              <p className="text-sm text-muted-foreground">
                {content.solution_description}
              </p>
            </div>
          )}
          {content.technical_approach && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Cách tiếp cận kỹ thuật
              </h3>
              <p className="text-sm text-muted-foreground">
                {content.technical_approach}
              </p>
            </div>
          )}
          {content.innovation_points &&
            content.innovation_points.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Điểm đổi mới</h3>
                <div className="space-y-1">
                  {content.innovation_points.map((point, index) => (
                    <Badge key={index} variant="secondary">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Lập kế hoạch tác động</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.expected_impact && (
            <div>
              <h3 className="text-sm font-medium mb-2">Tác động kỳ vọng</h3>
              <p className="text-sm text-muted-foreground">
                {content.expected_impact}
              </p>
            </div>
          )}
          {content.success_metrics && content.success_metrics.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Chỉ số thành công</h3>
              <div className="space-y-1">
                {content.success_metrics.map((metric, index) => (
                  <Badge key={index} variant="outline">
                    {metric}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Triển khai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.implementation_plan && (
            <div>
              <h3 className="text-sm font-medium mb-2">Kế hoạch triển khai</h3>
              <p className="text-sm text-muted-foreground">
                {content.implementation_plan}
              </p>
            </div>
          )}
          {content.resource_requirements &&
            content.resource_requirements.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Nguồn lực cần thiết
                </h3>
                <div className="space-y-1">
                  {content.resource_requirements.map((resource, index) => (
                    <Badge key={index} variant="outline">
                      {resource}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Thông tin nhóm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.team_description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Mô tả nhóm</h3>
              <p className="text-sm text-muted-foreground">
                {content.team_description}
              </p>
            </div>
          )}
          {content.skills_required && content.skills_required.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Kỹ năng cần có</h3>
              <div className="space-y-1">
                {content.skills_required.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
