import { redirect } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/translate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { createInvitation } from "../actions";

export default async function InviteMemberPage() {
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

  if (!hasPermission(ctx, "team.invite")) {
    redirect("/dashboard/team");
  }

  async function handleInvite(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

    if (!email || !role) {
      throw new Error(t("team.emailAndRoleRequired"));
    }

    await createInvitation({ email, role });
    redirect("/dashboard/team");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/team">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("team.inviteMember")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gửi lời mời tham gia đội nhóm.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>{t("team.inviteMember")}</CardTitle>
          <CardDescription>
            Thành viên được mời sẽ nhận được email chứa liên kết tham gia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("team.emailPlaceholder")} *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("team.emailPlaceholder")}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t("common.role")} *</Label>
              <Select name="role" required>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  <SelectItem value="leader">{t("roles.leader")}</SelectItem>
                  <SelectItem value="builder">{t("roles.builder")}</SelectItem>
                  <SelectItem value="expert">{t("roles.expert")}</SelectItem>
                  <SelectItem value="mentor">{t("roles.mentor")}</SelectItem>
                  <SelectItem value="member">{t("roles.member")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                {t("team.inviteMember")}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/team">{t("common.cancel")}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
