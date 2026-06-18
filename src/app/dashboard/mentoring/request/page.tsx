import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { createMentorshipRequest, getProjects, getUsers } from "../actions";
import { CreateMentorshipRequestForm } from "./create-request-form";

interface SearchParams {
  mentor_id?: string;
}

export default async function RequestMentorshipPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "mentorship.request.create")) {
    redirect("/dashboard/mentoring");
  }

  const [projects, mentors] = await Promise.all([getProjects(), getUsers()]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/mentoring">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Yêu cầu Quan hệ cố vấn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kết nối với cố vấn cho dự án của bạn.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Yêu cầu Quan hệ cố vấn</CardTitle>
          <CardDescription>
            Mô tả dự án của bạn và các khó khăn bạn cần giúp đỡ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateMentorshipRequestForm
            projects={projects ?? []}
            mentors={mentors ?? []}
            defaultMentorId={searchParams.mentor_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
