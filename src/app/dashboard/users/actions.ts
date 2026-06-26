"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  UserWithStatistics,
  UserDirectoryFilters,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  UserActivityFilters,
  UserStatistics,
  UserActivityLog,
} from "@/types/user-management";

// User Directory Actions
export async function getUsers(filters?: UserDirectoryFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(`
      *,
      user_statistics(
        problems_created,
        projects_joined,
        tasks_completed,
        last_activity_at
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.or(`display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.range(
    filters?.offset || 0,
    (filters?.offset || 0) + (filters?.limit || 50) - 1
  );

  if (error) throw error;

  return data as unknown as UserWithStatistics[];
}

export async function getUserById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      user_statistics(
        problems_created,
        problems_solved,
        projects_joined,
        projects_led,
        tasks_completed,
        reviews_completed,
        comments_count,
        votes_cast,
        last_activity_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function getUserCount(filters?: UserDirectoryFilters) {
  const supabase = await createClient();

  let query = supabase.from("profiles").select("id", { count: "exact", head: true });

  if (filters?.search) {
    query = query.or(`display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
}

// Role Management Actions
export async function updateUserRole(userId: string, input: UpdateUserRoleInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: input.role })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.rpc("log_user_activity", {
    p_user_id: user?.id,
    p_action: "role_change",
    p_entity_type: "user",
    p_entity_id: userId,
    p_metadata: {
      old_role: oldData?.role,
      new_role: input.role,
    },
  });

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "role_change",
    p_entity_type: "user",
    p_entity_id: userId,
    p_old_values: { role: oldData?.role },
    p_new_values: { role: input.role },
  });

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  return data;
}

// Status Management Actions
export async function updateUserStatus(userId: string, input: UpdateUserStatusInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .single();

  const { data, error } = await supabase
    .from("profiles")
    .update({ status: input.status })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.rpc("log_user_activity", {
    p_user_id: user?.id,
    p_action: "status_change",
    p_entity_type: "user",
    p_entity_id: userId,
    p_metadata: {
      old_status: oldData?.status,
      new_status: input.status,
      reason: input.reason,
    },
  });

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "update",
    p_entity_type: "user",
    p_entity_id: userId,
    p_old_values: { status: oldData?.status },
    p_new_values: { status: input.status },
  });

  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
  return data;
}

// User Statistics Actions
export async function getUserStatistics(userId: string): Promise<UserStatistics> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_statistics")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function incrementUserStat(userId: string, stat: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("increment_user_stat", {
    p_user_id: userId,
    p_stat_column: stat,
  });

  if (error) throw error;
}

// User Activity Actions
export async function getUserActivity(userId: string, filters?: UserActivityFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("user_activity_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  if (filters?.entity_type) {
    query = query.eq("entity_type", filters.entity_type);
  }

  if (filters?.start_date) {
    query = query.gte("created_at", filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte("created_at", filters.end_date);
  }

  const { data, error } = await query.limit(100);

  if (error) throw error;
  return data as UserActivityLog[];
}

export async function logUserActivity(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("log_user_activity", {
    p_user_id: userId,
    p_action: action,
    p_entity_type: entityType || null,
    p_entity_id: entityId || null,
    p_metadata: metadata || {},
  });

  if (error) throw error;
}

// Delete User Action
export async function deleteUser(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Delete from auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "delete",
    p_entity_type: "user",
    p_entity_id: userId,
    p_old_values: oldData,
  });

  revalidatePath("/dashboard/users");
}
