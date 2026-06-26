import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId)
      return NextResponse.json(
        { error: "projectId required" },
        { status: 400 },
      );

    const supabase = await createClient();
    const { data: membersData, error: membersError } = await supabase
      .from("project_members")
      .select("id,user_id,role")
      .eq("project_id", projectId)
      .order("role", { ascending: false });

    if (membersError) {
      console.error("workspace-members error:", membersError);
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 },
      );
    }

    const userIds = (membersData || [])
      .map((m: any) => m.user_id)
      .filter(Boolean);

    let profilesById: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, email, avatar_url")
        .in("id", userIds);
      if (profilesError) {
        console.error("workspace-members profiles error:", profilesError);
      } else if (profiles) {
        for (const p of profiles) profilesById[p.id] = p;
      }
    }

    const members = (membersData ?? []).map((m: any) => ({
      id: profilesById[m.user_id]?.id || m.user_id,
      user_id: m.user_id,
      display_name: profilesById[m.user_id]?.display_name || null,
      username: profilesById[m.user_id]?.username || null,
      email: profilesById[m.user_id]?.email || null,
      avatar_url: profilesById[m.user_id]?.avatar_url || null,
      role: m.role,
    }));

    return NextResponse.json({ members });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
