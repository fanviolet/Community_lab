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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Search, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorProfiles } from "../actions";

interface SearchParams {
  expertise?: string;
  search?: string;
}

export default async function MentorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
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

  if (!hasPermission(ctx, "mentor.view")) {
    redirect("/dashboard");
  }

  const mentors = await getMentorProfiles({
    expertise: resolvedSearchParams.expertise,
    search: resolvedSearchParams.search,
  });

  const allExpertise = Array.from(
    new Set(mentors.flatMap((m) => m.expertise))
  ).sort();

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
          <h1 className="text-2xl font-semibold tracking-tight">Danh bạ Cố vấn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm kiếm và kết nối với các cố vấn chuyên gia.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Lọc Cố vấn</CardTitle>
          <CardDescription>
            Tìm kiếm theo tên hoặc lọc theo lĩnh vực chuyên môn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm cố vấn..."
                  className="pl-10"
                  name="search"
                  defaultValue={resolvedSearchParams.search}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {allExpertise.map((expertise) => (
                <Button
                  key={expertise}
                  variant={resolvedSearchParams.expertise === expertise ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={{ pathname: "/dashboard/mentoring/directory", query: { expertise } }}>
                    {expertise}
                  </Link>
                </Button>
              ))}
              {resolvedSearchParams.expertise && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/mentoring/directory">Xóa</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {mentors.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy cố vấn</h3>
            <p className="text-sm text-muted-foreground text-center">
              Thử điều chỉnh tiêu chí tìm kiếm hoặc lọc của bạn.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mentor.user.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {mentor.user.full_name?.charAt(0).toUpperCase() ?? mentor.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{mentor.user.full_name || "Ẩn danh"}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {mentor.rating_avg.toFixed(1)} ({mentor.rating_count})
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise.slice(0, 3).map((exp) => (
                    <Badge key={exp} variant="secondary" className="text-xs">
                      {exp}
                    </Badge>
                  ))}
                  {mentor.expertise.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{mentor.expertise.length - 3}
                    </Badge>
                  )}
                </div>

                {mentor.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {mentor.bio}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{mentor.mentorship_count} quan hệ cố vấn</span>
                  <span>{mentor.years_experience} năm kinh nghiệm</span>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/dashboard/mentoring/request?mentor_id=${mentor.user_id}`}>
                    Yêu cầu Quan hệ cố vấn
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
