"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Workflow } from "lucide-react";

interface WorkflowSettingsProps {
  canManage: boolean;
}

export function WorkflowSettings({ canManage }: WorkflowSettingsProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Proposal Workflow
          </CardTitle>
          <CardDescription>
            Configure the pitch proposal review process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="proposal-auto-assign">Auto-assign reviewers</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign reviewers to new proposals
              </p>
            </div>
            <Switch id="proposal-auto-assign" disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="proposal-require-approval">Require approval before publication</Label>
              <p className="text-sm text-muted-foreground">
                Proposals must be approved before being published
              </p>
            </div>
            <Switch id="proposal-require-approval" defaultChecked disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="proposal-allow-revision">Allow revision requests</Label>
              <p className="text-sm text-muted-foreground">
                Reviewers can request revisions on proposals
              </p>
            </div>
            <Switch id="proposal-allow-revision" defaultChecked disabled={!canManage} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Review Workflow
          </CardTitle>
          <CardDescription>
            Configure the review and evaluation process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="review-require-evaluation">Require evaluation scores</Label>
              <p className="text-sm text-muted-foreground">
                Reviewers must provide evaluation scores
              </p>
            </div>
            <Switch id="review-require-evaluation" defaultChecked disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="review-min-reviewers">Minimum reviewers</Label>
              <p className="text-sm text-muted-foreground">
                Minimum number of reviewers per proposal
              </p>
            </div>
            <select
              id="review-min-reviewers"
              className="w-32 px-3 py-2 border rounded-md"
              disabled={!canManage}
            >
              <option value="1">1</option>
              <option value="2" selected>2</option>
              <option value="3">3</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Project Workflow
          </CardTitle>
          <CardDescription>
            Configure project creation and management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="project-auto-create">Auto-create workspace</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create workspace when project is approved
              </p>
            </div>
            <Switch id="project-auto-create" disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="project-require-team">Require team assignment</Label>
              <p className="text-sm text-muted-foreground">
                Projects must have team members assigned
              </p>
            </div>
            <Switch id="project-require-team" defaultChecked disabled={!canManage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
