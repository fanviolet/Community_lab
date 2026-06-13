export type SettingType = "string" | "number" | "boolean" | "json";
export type SettingCategory = "general" | "platform" | "branding";
export type AIProvider = "openai" | "anthropic" | "google" | "local" | "custom";
export type PromptCategory = "analysis" | "review" | "generation" | "custom";
export type WorkflowType = "proposal" | "review" | "project";
export type NotificationType = "email" | "in_app" | "push";
export type EventType = "pitch_submitted" | "pitch_approved" | "pitch_rejected" | "review_assigned" | "comment_added" | "task_assigned" | "milestone_completed";
export type RecipientType = "all" | "admins" | "leaders" | "reviewers" | "creators";
export type SecurityCategory = "session" | "password" | "access" | "audit";
export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "permission_change" | "role_change" | "system_update";

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: SettingType;
  category: SettingCategory;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface SystemSettingInput {
  setting_key: string;
  setting_value: string;
  setting_type?: SettingType;
  category?: SettingCategory;
  description?: string;
  is_public?: boolean;
}

export interface AISetting {
  id: string;
  provider: AIProvider;
  model_name: string;
  api_key: string | null;
  api_endpoint: string | null;
  max_tokens: number;
  temperature: number;
  is_enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface AISettingInput {
  provider: AIProvider;
  model_name: string;
  api_key?: string;
  api_endpoint?: string;
  max_tokens?: number;
  temperature?: number;
  is_enabled?: boolean;
  is_default?: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  template: string;
  category: PromptCategory;
  variables: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PromptTemplateInput {
  name: string;
  description?: string;
  template: string;
  category: PromptCategory;
  variables?: Record<string, any>;
  is_active?: boolean;
}

export interface WorkflowSetting {
  id: string;
  workflow_type: WorkflowType;
  config: Record<string, any>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface WorkflowSettingInput {
  workflow_type: WorkflowType;
  config: Record<string, any>;
  is_enabled?: boolean;
}

export interface NotificationSetting {
  id: string;
  notification_type: NotificationType;
  event_type: EventType;
  is_enabled: boolean;
  recipient_type: RecipientType;
  template: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface NotificationSettingInput {
  notification_type: NotificationType;
  event_type: EventType;
  is_enabled?: boolean;
  recipient_type?: RecipientType;
  template?: string;
}

export interface SecuritySetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: SettingType;
  category: SecurityCategory;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SecuritySettingInput {
  setting_key: string;
  setting_value: string;
  setting_type?: SettingType;
  category?: SecurityCategory;
  description?: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogWithUser extends AuditLog {
  user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface AuditLogFilters {
  action?: AuditAction;
  entity_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}
