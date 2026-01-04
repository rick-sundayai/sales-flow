-- ============================================================================
-- TWO-FACTOR AUTHENTICATION FIELDS MIGRATION
-- Adds 2FA support fields to the user_profiles table
-- ============================================================================

-- Add 2FA fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS two_factor_secret text,
ADD COLUMN IF NOT EXISTS two_factor_secret_temp text,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes text[],
ADD COLUMN IF NOT EXISTS two_factor_enabled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS two_factor_disabled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS two_factor_last_used timestamp with time zone;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.two_factor_enabled IS 'Whether 2FA is currently enabled for this user';
COMMENT ON COLUMN public.user_profiles.two_factor_secret IS 'Encrypted TOTP secret key for 2FA (only set when 2FA is enabled)';
COMMENT ON COLUMN public.user_profiles.two_factor_secret_temp IS 'Temporary TOTP secret during setup process (cleared after verification)';
COMMENT ON COLUMN public.user_profiles.two_factor_backup_codes IS 'Array of backup codes for 2FA recovery';
COMMENT ON COLUMN public.user_profiles.two_factor_enabled_at IS 'Timestamp when 2FA was enabled';
COMMENT ON COLUMN public.user_profiles.two_factor_disabled_at IS 'Timestamp when 2FA was last disabled';
COMMENT ON COLUMN public.user_profiles.two_factor_last_used IS 'Timestamp when 2FA was last used for authentication';

-- Create index for 2FA enabled users (for efficient queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_2fa_enabled 
ON public.user_profiles(two_factor_enabled) 
WHERE two_factor_enabled = true;

-- Create partial index for users with active 2FA secrets
CREATE INDEX IF NOT EXISTS idx_user_profiles_2fa_secret 
ON public.user_profiles(two_factor_secret) 
WHERE two_factor_secret IS NOT NULL;

-- Update the trigger function to handle new 2FA fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    first_name, 
    last_name,
    two_factor_enabled
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    false  -- 2FA disabled by default for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECURITY FUNCTIONS FOR 2FA VALIDATION
-- ============================================================================

-- Function to safely check if user has 2FA enabled (for use in RLS policies)
CREATE OR REPLACE FUNCTION public.user_has_2fa_enabled(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT two_factor_enabled 
    FROM public.user_profiles 
    WHERE user_id = user_uuid
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get 2FA status without exposing sensitive data
CREATE OR REPLACE FUNCTION public.get_2fa_status(user_uuid uuid)
RETURNS TABLE (
  is_enabled boolean,
  has_backup_codes boolean,
  last_used timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    COALESCE(up.two_factor_enabled, false) as is_enabled,
    (up.two_factor_backup_codes IS NOT NULL AND array_length(up.two_factor_backup_codes, 1) > 0) as has_backup_codes,
    up.two_factor_last_used
  FROM public.user_profiles up
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING FOR 2FA EVENTS
-- ============================================================================

-- Create 2FA audit log table
CREATE TABLE IF NOT EXISTS public.two_factor_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('enabled', 'disabled', 'code_used', 'backup_code_used', 'setup_started', 'verification_failed')),
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit log
ALTER TABLE public.two_factor_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own audit logs
CREATE POLICY "two_factor_audit_log_policy" ON public.two_factor_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_2fa_audit_user_id_created 
ON public.two_factor_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_2fa_audit_event_type 
ON public.two_factor_audit_log(event_type, created_at DESC);

-- Function to log 2FA events
CREATE OR REPLACE FUNCTION public.log_2fa_event(
  user_uuid uuid,
  event_type text,
  ip_addr inet DEFAULT NULL,
  user_agent text DEFAULT NULL,
  event_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.two_factor_audit_log (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (user_uuid, event_type, ip_addr, user_agent, event_metadata);
EXCEPTION WHEN OTHERS THEN
  -- Log errors but don't fail the main operation
  RAISE WARNING 'Failed to log 2FA event: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up old audit logs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_2fa_audit_logs(retention_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.two_factor_audit_log 
  WHERE created_at < (NOW() - INTERVAL '1 day' * retention_days);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired temporary secrets (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_temp_secrets(expiry_hours integer DEFAULT 1)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.user_profiles 
  SET 
    two_factor_secret_temp = NULL,
    updated_at = timezone('utc'::text, now())
  WHERE 
    two_factor_secret_temp IS NOT NULL 
    AND updated_at < (NOW() - INTERVAL '1 hour' * expiry_hours);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 TWO-FACTOR AUTHENTICATION SETUP COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ 2FA fields added to user_profiles table';
  RAISE NOTICE '✅ Security functions created';
  RAISE NOTICE '✅ Audit logging table created';
  RAISE NOTICE '✅ Cleanup functions added';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your application now supports 2FA!';
  RAISE NOTICE 'Users can enable TOTP-based two-factor authentication.';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Recommended maintenance tasks:';
  RAISE NOTICE '• Run cleanup_2fa_audit_logs() monthly';
  RAISE NOTICE '• Run cleanup_expired_2fa_temp_secrets() hourly';
  RAISE NOTICE '';
END $$;