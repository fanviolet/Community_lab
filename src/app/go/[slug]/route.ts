import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isWithinActiveWindow(tool: {
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}) {
  if (!tool.is_active) return false;
  const now = new Date();
  const startOk = !tool.start_date || new Date(tool.start_date) <= now;
  const endOk = !tool.end_date || new Date(tool.end_date) >= now;
  return startOk && endOk;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  console.log("Redirect slug:", slug);

  const supabase = await createClient();

  const { data: tool, error } = await supabase
    .from("recommended_tools")
    .select("slug, destination_url, is_active, start_date, end_date")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Recommended tool query failed", error);
    return NextResponse.json(
      { error: "Failed to load recommended tool." },
      { status: 500 },
    );
  }

  if (!tool || !isWithinActiveWindow(tool)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const { error: rpcError } = await supabase.rpc(
    "increment_recommended_tool_click",
    {
      tool_slug: slug,
    },
  );

  if (rpcError) {
    console.error("Click tracking failed", rpcError);
  }

  return NextResponse.redirect(tool.destination_url, { status: 302 });
}
