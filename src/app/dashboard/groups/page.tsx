import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Compass, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth/server";
import {
  getDiscoverableGroups,
  getGroupMembershipState,
  getUserGroups,
} from "@/lib/groups/server";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";

export default async function GroupsPage() {
  const { user } = await getAuthSession();
  if (!user) {
    redirect("/login");
  }

  const [myGroups, publicGroups] = await Promise.all([
    getUserGroups(user.id),
    getDiscoverableGroups(),
  ]);

  const myGroupIds = new Set(myGroups.map((g) => g.id));

  const discoverGroups = await Promise.all(
    publicGroups
      .filter((group) => !myGroupIds.has(group.id))
      .map(async (group) => ({
        ...group,
        state: await getGroupMembershipState(group.id, user.id),
      })),
  );

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover communities and manage your memberships
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {/* My Groups */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Groups</h2>
          <span className="text-sm text-muted-foreground">{myGroups.length} communities</span>
        </div>
        {myGroups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-medium mb-2">No groups yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't joined any communities. Browse public groups below to request access.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="#discover">Explore Communities</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {myGroups.map((group) => (
              <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                <Card className="group hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {group.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Discover Groups */}
      <section id="discover" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Discover Groups</h2>
          <span className="text-sm text-muted-foreground">{discoverGroups.length} available</span>
        </div>
        {discoverGroups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Compass className="mx-auto size-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-medium mb-2">No public groups available</h3>
              <p className="text-sm text-muted-foreground">
                Check back later or contact an administrator to create new communities.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {discoverGroups.map((group) => (
              <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                <Card className="group hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{group.name}</CardTitle>
                          {group.state === "pending" && (
                            <Badge variant="secondary" className="shrink-0 text-xs">Pending</Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2 mt-1">
                          {group.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
