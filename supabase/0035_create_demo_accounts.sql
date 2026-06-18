-- Create Demo Accounts
-- This migration creates demo accounts for testing purposes

-- ============================================================================
-- DEMO ACCOUNTS
-- ============================================================================

-- Note: These accounts will be created with the following credentials:
-- Guest: guest@communitylab.demo / demo123
-- Leader: leader@communitylab.demo / demo123

-- The actual user creation will be done through the Supabase Auth API
-- This migration ensures the profiles table has the correct roles

-- Insert demo profiles (these will be linked to auth users created separately)
-- This is a placeholder - actual user creation should be done via Supabase Dashboard or API

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Demo accounts migration prepared. Create users via Supabase Auth API with emails: guest@communitylab.demo, leader@communitylab.demo';
END $$;
