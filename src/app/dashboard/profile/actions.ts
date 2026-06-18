"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100),
  username: z.string().min(3, "Username must be at least 3 characters").max(50).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().max(100).optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

const notificationSchema = z.object({
  enable_notifications: z.boolean(),
  enable_task_notifications: z.boolean(),
  enable_project_notifications: z.boolean(),
  enable_pitch_notifications: z.boolean(),
  enable_mention_notifications: z.boolean(),
  enable_ai_notifications: z.boolean(),
});

// ============================================================================
// GET PROFILE
// ============================================================================

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      username,
      bio,
      avatar_url,
      skills,
      interests,
      website,
      location,
      role,
      status,
      created_at,
      updated_at
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  // Return profile even if null (user authenticated but no profile record yet)
  return { profile };
}

// ============================================================================
// UPDATE PROFILE
// ============================================================================

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  const rawData = {
    display_name: formData.get("display_name") as string,
    username: formData.get("username") as string,
    bio: formData.get("bio") as string,
    skills: JSON.parse(formData.get("skills") as string || "[]"),
    interests: JSON.parse(formData.get("interests") as string || "[]"),
    website: formData.get("website") as string,
    location: formData.get("location") as string,
  };

  const validatedData = profileSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  // Check if username is unique (if changed)
  if (validatedData.data.username) {
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", validatedData.data.username)
      .neq("id", user.id)
      .single();

    if (existingUser) {
      return { error: "Username already taken" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: validatedData.data.display_name,
      username: validatedData.data.username,
      bio: validatedData.data.bio || null,
      skills: validatedData.data.skills || [],
      interests: validatedData.data.interests || [],
      website: validatedData.data.website || null,
      location: validatedData.data.location || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ============================================================================
// UPLOAD AVATAR
// ============================================================================

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("avatar") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  // Validate file type
  const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!acceptedTypes.includes(file.type)) {
    return { error: "Invalid file type. Please upload JPG, PNG, or WebP." };
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File too large. Maximum size is 5MB." };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true, avatarUrl: publicUrl };
}

// ============================================================================
// DELETE AVATAR
// ============================================================================

export async function deleteAvatar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  // Get current avatar URL
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    // Extract file path from URL
    const url = new URL(profile.avatar_url);
    const filePath = url.pathname.split("/").pop();

    if (filePath) {
      await supabase.storage
        .from("avatars")
        .remove([filePath]);
    }
  }

  // Update profile to remove avatar URL
  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ============================================================================
// GET USER STATISTICS
// ============================================================================

export async function getUserStatistics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  const { data: stats, error } = await supabase
    .from("user_statistics")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { stats };
}

// ============================================================================
// GET USER ACTIVITY
// ============================================================================

export async function getUserActivity(limit: number = 10) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  const { data: activities, error } = await supabase
    .from("user_activity_log")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { activities };
}

// ============================================================================
// UPDATE NOTIFICATION PREFERENCES
// ============================================================================

export async function updateNotificationPreferences(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  const rawData = {
    enable_notifications: formData.get("enable_notifications") === "true",
    enable_task_notifications: formData.get("enable_task_notifications") === "true",
    enable_project_notifications: formData.get("enable_project_notifications") === "true",
    enable_pitch_notifications: formData.get("enable_pitch_notifications") === "true",
    enable_mention_notifications: formData.get("enable_mention_notifications") === "true",
    enable_ai_notifications: formData.get("enable_ai_notifications") === "true",
  };

  const validatedData = notificationSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { error } = await supabase
    .from("user_notification_prefs")
    .upsert({
      user_id: user.id,
      ...validatedData.data,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// ============================================================================
// GET NOTIFICATION PREFERENCES
// ============================================================================

export async function getNotificationPreferences() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  const { data: prefs, error } = await supabase
    .rpc("get_or_create_user_prefs", { p_user_id: user.id });

  if (error) {
    return { error: error.message };
  }

  return { prefs };
}

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Not authenticated" };
  }

  if (!user.email) {
    return { error: "User email not found" };
  }

  const rawData = {
    current_password: formData.get("current_password") as string,
    new_password: formData.get("new_password") as string,
  };

  const validatedData = passwordSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: validatedData.data.current_password,
  });

  if (signInError) {
    return { error: "Current password is incorrect" };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: validatedData.data.new_password,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
