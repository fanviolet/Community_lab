"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  SystemSettingInput,
  AISettingInput,
  PromptTemplateInput,
  WorkflowSettingInput,
  NotificationSettingInput,
  SecuritySettingInput,
  AuditLogFilters,
} from "@/types/system-settings";

// System Settings Actions
export async function getSystemSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("category", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPublicSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("is_public", true);

  if (error) throw error;
  return data;
}

export async function getSystemSetting(key: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("setting_key", key)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSystemSetting(key: string, input: Partial<SystemSettingInput>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("system_settings")
    .select("*")
    .eq("setting_key", key)
    .single();

  const { data, error } = await supabase
    .from("system_settings")
    .update({
      ...input,
      updated_by: user?.id,
    })
    .eq("setting_key", key)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "update",
    p_entity_type: "system_setting",
    p_entity_id: key,
    p_old_values: oldData ? { setting_value: oldData.setting_value } : null,
    p_new_values: { setting_value: input.setting_value },
  });

  revalidatePath("/dashboard/settings");
  return data;
}

// AI Settings Actions
export async function getAISettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDefaultAISetting() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("is_default", true)
    .eq("is_enabled", true)
    .single();

  if (error) throw error;
  return data;
}

export async function createAISetting(input: AISettingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("ai_settings")
    .insert({
      ...input,
      updated_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "create",
    p_entity_type: "ai_setting",
    p_entity_id: data.id,
    p_new_values: input,
  });

  revalidatePath("/dashboard/settings");
  return data;
}

export async function updateAISetting(id: string, input: Partial<AISettingInput>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("ai_settings")
    .update({
      ...input,
      updated_by: user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "update",
    p_entity_type: "ai_setting",
    p_entity_id: id,
    p_old_values: oldData,
    p_new_values: input,
  });

  revalidatePath("/dashboard/settings");
  return data;
}

export async function deleteAISetting(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("ai_settings")
    .delete()
    .eq("id", id);

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "delete",
    p_entity_type: "ai_setting",
    p_entity_id: id,
    p_old_values: oldData,
  });

  revalidatePath("/dashboard/settings");
}

export async function setDefaultAISetting(id: string) {
  const supabase = await createClient();

  // Unset all defaults
  await supabase
    .from("ai_settings")
    .update({ is_default: false })
    .neq("id", id);

  // Set new default
  const { data, error } = await supabase
    .from("ai_settings")
    .update({ is_default: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/settings");
  return data;
}

// Prompt Templates Actions
export async function getPromptTemplates() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prompt_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPromptTemplatesByCategory(category: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("category", category)
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

export async function createPromptTemplate(input: PromptTemplateInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("prompt_templates")
    .insert({
      ...input,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "create",
    p_entity_type: "prompt_template",
    p_entity_id: data.id,
    p_new_values: input,
  });

  revalidatePath("/dashboard/settings");
  return data;
}

export async function updatePromptTemplate(id: string, input: Partial<PromptTemplateInput>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("prompt_templates")
    .update({
      ...input,
      updated_by: user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "update",
    p_entity_type: "prompt_template",
    p_entity_id: id,
    p_old_values: oldData,
    p_new_values: input,
  });

  revalidatePath("/dashboard/settings");
  return data;
}

export async function deletePromptTemplate(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("prompt_templates")
    .delete()
    .eq("id", id);

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "delete",
    p_entity_type: "prompt_template",
    p_entity_id: id,
    p_old_values: oldData,
  });

  revalidatePath("/dashboard/settings");
}

// Workflow Settings Actions
export async function getWorkflowSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workflow_settings")
    .select("*")
    .order("workflow_type", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getWorkflowSetting(type: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workflow_settings")
    .select("*")
    .eq("workflow_type", type)
    .single();

  if (error) throw error;
  return data;
}

export async function createWorkflowSetting(input: WorkflowSettingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("workflow_settings")
    .insert({
      ...input,
      updated_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "create",
    p_entity_type: "workflow_setting",
    p_entity_id: data.id,
    p_new_values: input,
  });

  revalidatePath("/dashboard/settings");
  return data;
}

export async function updateWorkflowSetting(id: string, input: Partial<WorkflowSettingInput>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("workflow_settings")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("workflow_settings")
    .update({
      ...input,
      updated_by: user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "update",
    p_entity_type: "workflow_setting",
    p_entity_id: id,
    p_old_values: oldData,
    p_new_values: input,
  });

  revalidatePath("/dashboard/settings");
  return data;
}

// Notification Settings Actions
export async function getNotificationSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .order("notification_type", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateNotificationSetting(id: string, input: Partial<NotificationSettingInput>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("notification_settings")
    .update({
      ...input,
      updated_by: user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "update",
    p_entity_type: "notification_setting",
    p_entity_id: id,
    p_old_values: oldData,
    p_new_values: input,
  });

  revalidatePath("/dashboard/settings");
  return data;
}

// Security Settings Actions
export async function getSecuritySettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("security_settings")
    .select("*")
    .order("category", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateSecuritySetting(key: string, input: Partial<SecuritySettingInput>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: oldData } = await supabase
    .from("security_settings")
    .select("*")
    .eq("setting_key", key)
    .single();

  const { data, error } = await supabase
    .from("security_settings")
    .update({
      ...input,
      updated_by: user?.id,
    })
    .eq("setting_key", key)
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await supabase.rpc("log_audit", {
    p_user_id: user?.id,
    p_action: "update",
    p_entity_type: "security_setting",
    p_entity_id: key,
    p_old_values: oldData ? { setting_value: oldData.setting_value } : null,
    p_new_values: { setting_value: input.setting_value },
  });

  revalidatePath("/dashboard/settings");
  return data;
}

// Audit Logs Actions
export async function getAuditLogs(filters?: AuditLogFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      user:profiles(id, full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.entity_type) {
    query = query.eq("entity_type", filters.entity_type);
  }
  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters?.start_date) {
    query = query.gte("created_at", filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte("created_at", filters.end_date);
  }

  const { data, error } = await query.limit(100);

  if (error) throw error;
  return data;
}
