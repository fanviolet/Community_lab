-- System Settings Module
-- Create tables for system settings, AI settings, workflow settings, notification settings, security settings, and audit logs

-- System settings table (general platform settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'platform', 'branding')),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- AI settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'local', 'custom')),
  model_name TEXT NOT NULL,
  api_key TEXT,
  api_endpoint TEXT,
  max_tokens INTEGER DEFAULT 2048,
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  is_enabled BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Prompt templates table
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('analysis', 'review', 'generation', 'custom')),
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Workflow settings table
CREATE TABLE IF NOT EXISTS public.workflow_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('proposal', 'review', 'project')),
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'in_app', 'push')),
  event_type TEXT NOT NULL CHECK (event_type IN ('pitch_submitted', 'pitch_approved', 'pitch_rejected', 'review_assigned', 'comment_added', 'task_assigned', 'milestone_completed')),
  is_enabled BOOLEAN DEFAULT TRUE,
  recipient_type TEXT DEFAULT 'all' CHECK (recipient_type IN ('all', 'admins', 'leaders', 'reviewers', 'creators')),
  template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Security settings table
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  category TEXT DEFAULT 'security' CHECK (category IN ('session', 'password', 'access', 'audit')),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'permission_change', 'role_change', 'system_update')),
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

CREATE INDEX IF NOT EXISTS idx_ai_settings_provider ON public.ai_settings(provider);
CREATE INDEX IF NOT EXISTS idx_ai_settings_enabled ON public.ai_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_settings_default ON public.ai_settings(is_default);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON public.prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON public.prompt_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_workflow_settings_type ON public.workflow_settings(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_settings_enabled ON public.workflow_settings(is_enabled);

CREATE INDEX IF NOT EXISTS idx_notification_settings_type ON public.notification_settings(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_settings_event ON public.notification_settings(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_settings_enabled ON public.notification_settings(is_enabled);

CREATE INDEX IF NOT EXISTS idx_security_settings_key ON public.security_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_security_settings_category ON public.security_settings(category);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Row Level Security policies

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- System settings policies
CREATE POLICY "Admins can view all system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Public can view public settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- AI settings policies
CREATE POLICY "Admins can view all AI settings"
  ON public.ai_settings
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage AI settings"
  ON public.ai_settings
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Prompt templates policies
CREATE POLICY "Admins can view all prompt templates"
  ON public.prompt_templates
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage prompt templates"
  ON public.prompt_templates
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Workflow settings policies
CREATE POLICY "Admins can view all workflow settings"
  ON public.workflow_settings
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage workflow settings"
  ON public.workflow_settings
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Notification settings policies
CREATE POLICY "Admins can view all notification settings"
  ON public.notification_settings
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage notification settings"
  ON public.notification_settings
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Security settings policies
CREATE POLICY "Admins can view all security settings"
  ON public.security_settings
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage security settings"
  ON public.security_settings
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "System can create audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Updated at triggers
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER workflow_settings_updated_at
  BEFORE UPDATE ON public.workflow_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to log audit entries
CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES
  ('platform_name', 'Community Lab', 'string', 'platform', 'The name of the platform', true),
  ('platform_description', 'A platform for community-driven innovation', 'string', 'platform', 'Platform description', true),
  ('logo_url', '', 'string', 'branding', 'URL to the platform logo', true),
  ('primary_color', '#3b82f6', 'string', 'branding', 'Primary brand color', true),
  ('secondary_color', '#6366f1', 'string', 'branding', 'Secondary brand color', true),
  ('support_email', 'support@communitylab.com', 'string', 'general', 'Support email address', true),
  ('terms_url', '/terms', 'string', 'general', 'Terms of service URL', true),
  ('privacy_url', '/privacy', 'string', 'general', 'Privacy policy URL', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default security settings
INSERT INTO public.security_settings (setting_key, setting_value, setting_type, category, description)
VALUES
  ('session_timeout', '86400', 'number', 'session', 'Session timeout in seconds (default: 24 hours)'),
  ('max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout'),
  ('password_min_length', '8', 'number', 'password', 'Minimum password length'),
  ('password_require_special', 'true', 'boolean', 'password', 'Require special characters in password'),
  ('password_require_number', 'true', 'boolean', 'password', 'Require numbers in password'),
  ('password_require_uppercase', 'true', 'boolean', 'password', 'Require uppercase letters in password'),
  ('two_factor_enabled', 'false', 'boolean', 'security', 'Enable two-factor authentication'),
  ('audit_log_retention', '90', 'number', 'audit', 'Audit log retention period in days')
ON CONFLICT (setting_key) DO NOTHING;
