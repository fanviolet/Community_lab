import { redirect } from "next/navigation";
import { getProfile } from "./actions";
import { ProfileOverview } from "./components/profile-overview";
import { ProfileCommunity } from "./components/profile-community";
import { ProfileAccount } from "./components/profile-account";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, Shield } from "lucide-react";

export default async function ProfilePage() {
  const { profile, error } = await getProfile();

  // Only redirect to login if there's a true authentication error
  // If profile is null, user is authenticated but hasn't created a profile yet
  if (error === "Not authenticated") {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin hồ sơ và tùy chọn của bạn
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="mr-2 h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="community">
            <Users className="mr-2 h-4 w-4" />
            Cộng đồng
          </TabsTrigger>
          <TabsTrigger value="account">
            <Shield className="mr-2 h-4 w-4" />
            Tài khoản
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProfileOverview profile={profile} />
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <ProfileCommunity />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <ProfileAccount profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
