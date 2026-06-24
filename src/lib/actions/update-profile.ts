"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileInput {
  display_name: string;
  username: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  website?: string;
  location?: string;
}

export interface UpdateProfileResult {
  success?: boolean;
  error?: string;
}

export async function updateProfile(
  data: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Không được xác thực" };
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(data.username)) {
    return {
      error: "Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch ngang và dấu gạch dưới",
    };
  }

  // Check if username is unique (if changed)
  if (data.username) {
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .neq("id", user.id)
      .single();

    if (existingUser) {
      return { error: "Username đã được sử dụng" };
    }
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: data.display_name,
        username: data.username,
        bio: data.bio || null,
        skills: data.skills || [],
        interests: data.interests || [],
        website: data.website || null,
        location: data.location || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error) {
    return { error: "Có lỗi xảy ra khi lưu hồ sơ" };
  }
}

export interface UploadAvatarResult {
  success?: boolean;
  error?: string;
  avatarUrl?: string;
}

export async function uploadAvatar(
  file: File
): Promise<UploadAvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Không được xác thực" };
  }

  // Validate file type
  const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!acceptedTypes.includes(file.type)) {
    return { error: "Định dạng file không hợp lệ. Vui lòng tải lên JPG, PNG hoặc WebP." };
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File quá lớn. Kích thước tối đa là 5MB." };
  }

  try {
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

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
  } catch (error) {
    return { error: "Có lỗi xảy ra khi tải lên avatar" };
  }
}

export async function deleteAvatar(): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { error: "Không được xác thực" };
  }

  try {
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
        await supabase.storage.from("avatars").remove([filePath]);
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
  } catch (error) {
    return { error: "Có lỗi xảy ra khi xóa avatar" };
  }
}

export interface ValidateUsernameResult {
  valid: boolean;
  error?: string;
  available?: boolean;
}

export async function validateUsername(
  username: string
): Promise<ValidateUsernameResult> {
  // Check format first
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: "Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch ngang và dấu gạch dưới",
    };
  }

  if (username.length < 3) {
    return {
      valid: false,
      error: "Tên đăng nhập phải có ít nhất 3 ký tự",
    };
  }

  // Check availability
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { valid: false, error: "Không được xác thực" };
  }

  try {
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .single();

    if (existingUser) {
      return { valid: true, available: false, error: "Username đã được sử dụng" };
    }

    return { valid: true, available: true };
  } catch (error) {
    return { valid: true, available: true };
  }
}