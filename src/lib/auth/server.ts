import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { parseRole, type Role } from "@/lib/rbac";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Request-scoped auth helpers. React.cache deduplicates calls within a single
 * RSC render pass (middleware still runs its own getUser per HTTP request).
 */
export const getAuthSession = cache(async (): Promise<{
  supabase: SupabaseServerClient;
  user: User | null;
}> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
});

export const getCachedProfileRole = cache(async (userId: string): Promise<Role> => {
  const { supabase } = await getAuthSession();

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return parseRole(data?.role);
});
