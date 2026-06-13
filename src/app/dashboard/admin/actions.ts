"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAssignRole, Role } from "@/lib/rbac";

export async function getUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at, avatar_url")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, newRole: Role) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Only admins can change user roles");
  }

  if (!canAssignRole(adminProfile.role as Role, newRole)) {
    throw new Error("Cannot assign this role");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw error;

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/rbac-audit");
}

export async function suspendUser(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Only admins can suspend users");
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "999y",
  });

  if (error) throw error;

  revalidatePath("/dashboard/admin");
}

export async function unsuspendUser(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Only admins can unsuspend users");
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "0s",
  });

  if (error) throw error;

  revalidatePath("/dashboard/admin");
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Only admins can delete users");
  }

  if (userId === user.id) {
    throw new Error("Cannot delete your own account");
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) throw error;

  revalidatePath("/dashboard/admin");
}

export async function getUserProjectMemberships(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
      project_id,
      projects (
        id,
        title,
        status
      ),
      role
    `
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}
