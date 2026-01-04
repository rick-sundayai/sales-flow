-- ============================================================================
-- GDPR COMPLIANCE SCHEMA
-- Implements data protection and privacy rights under GDPR
-- ============================================================================

-- Create enum types for GDPR tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_status') THEN
    CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'expired');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deletion_status') THEN
    CREATE TYPE deletion_status AS ENUM ('pending', 'scheduled', 'processing', 'completed', 'cancelled', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consent_type') THEN
    CREATE TYPE consent_type AS ENUM ('marketing', 'analytics', 'functional', 'performance');
  END IF;
END $$;

-- ============================================================================
-- DATA EXPORT REQUESTS TABLE
-- Tracks user requests for data export (GDPR Article 20)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status export_status NOT NULL DEFAULT 'pending',
  requested_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone,
  expires_at timestamp with time zone,
  download_url text,
  file_size bigint,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- DATA DELETION REQUESTS TABLE
-- Tracks user requests for account/data deletion (GDPR Article 17)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status deletion_status NOT NULL DEFAULT 'pending',
  reason text,
  requested_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  scheduled_for timestamp with time zone,
  completed_at timestamp with time zone,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- USER CONSENT TABLE
-- Tracks user consent preferences for various data processing purposes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_consent (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consent_type consent_type NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  granted_at timestamp with time zone,
  revoked_at timestamp with time zone,
  ip_address inet,
  user_agent text,
  archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one consent record per user per type
  UNIQUE(user_id, consent_type)
);

-- ============================================================================
-- PRIVACY POLICY ACCEPTANCE TABLE
-- Tracks when users accept privacy policy versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.privacy_policy_acceptance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  policy_version text NOT NULL,
  accepted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- DATA PROCESSING ACTIVITIES TABLE
-- Records what data processing activities are performed (for transparency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_processing_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_name text NOT NULL,
  purpose text NOT NULL,
  legal_basis text NOT NULL, -- e.g., 'consent', 'legitimate_interest', 'contract'
  data_categories text[] NOT NULL, -- e.g., 'personal_data', 'contact_info', 'usage_data'
  retention_period interval,
  recipients text[], -- Who data might be shared with
  third_countries text[], -- Any non-EU countries data is transferred to
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all GDPR tables
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policy_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processing_activities ENABLE ROW LEVEL SECURITY;

-- Data export requests: Users can only see their own requests
CREATE POLICY "data_export_requests_user_policy" ON public.data_export_requests
  FOR ALL USING (auth.uid() = user_id);

-- Data deletion requests: Users can only see their own requests
CREATE POLICY "data_deletion_requests_user_policy" ON public.data_deletion_requests
  FOR ALL USING (auth.uid() = user_id);

-- User consent: Users can only see/modify their own consent
CREATE POLICY "user_consent_user_policy" ON public.user_consent
  FOR ALL USING (auth.uid() = user_id);

-- Privacy policy acceptance: Users can only see their own acceptance records
CREATE POLICY "privacy_policy_acceptance_user_policy" ON public.privacy_policy_acceptance
  FOR SELECT USING (auth.uid() = user_id);

-- Privacy policy acceptance: Only allow inserts for authenticated users
CREATE POLICY "privacy_policy_acceptance_insert_policy" ON public.privacy_policy_acceptance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Data processing activities: Read-only for all authenticated users
CREATE POLICY "data_processing_activities_read_policy" ON public.data_processing_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Data export requests indexes
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id 
ON public.data_export_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_status 
ON public.data_export_requests(status, created_at DESC);

-- Data deletion requests indexes
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id 
ON public.data_deletion_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_scheduled 
ON public.data_deletion_requests(scheduled_for) 
WHERE status = 'scheduled';

-- User consent indexes
CREATE INDEX IF NOT EXISTS idx_user_consent_user_id 
ON public.user_consent(user_id, consent_type);

CREATE INDEX IF NOT EXISTS idx_user_consent_type 
ON public.user_consent(consent_type, granted);

-- Privacy policy acceptance indexes
CREATE INDEX IF NOT EXISTS idx_privacy_policy_user_version 
ON public.privacy_policy_acceptance(user_id, policy_version, accepted_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

-- Data export requests trigger
CREATE TRIGGER update_data_export_requests_updated_at 
  BEFORE UPDATE ON public.data_export_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Data deletion requests trigger
CREATE TRIGGER update_data_deletion_requests_updated_at 
  BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User consent trigger
CREATE TRIGGER update_user_consent_updated_at 
  BEFORE UPDATE ON public.user_consent
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Data processing activities trigger
CREATE TRIGGER update_data_processing_activities_updated_at 
  BEFORE UPDATE ON public.data_processing_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GDPR COMPLIANCE FUNCTIONS
-- ============================================================================

-- Function to check if user has valid consent for a specific purpose
CREATE OR REPLACE FUNCTION public.has_user_consent(
  user_uuid uuid,
  purpose consent_type
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_consent 
    WHERE user_id = user_uuid 
      AND consent_type = purpose 
      AND granted = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's data export summary
CREATE OR REPLACE FUNCTION public.get_user_data_summary(user_uuid uuid)
RETURNS TABLE (
  table_name text,
  record_count bigint,
  last_updated timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 'user_profiles'::text, COUNT(*)::bigint, MAX(updated_at)
  FROM public.user_profiles WHERE user_id = user_uuid
  UNION ALL
  SELECT 'clients'::text, COUNT(*)::bigint, MAX(updated_at)
  FROM public.clients WHERE user_id = user_uuid
  UNION ALL
  SELECT 'deals'::text, COUNT(*)::bigint, MAX(updated_at)
  FROM public.deals WHERE user_id = user_uuid
  UNION ALL
  SELECT 'activities'::text, COUNT(*)::bigint, MAX(updated_at)
  FROM public.activities WHERE user_id = user_uuid
  UNION ALL
  SELECT 'audit_logs'::text, COUNT(*)::bigint, MAX(created_at)
  FROM public.audit_logs WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize user data (for retention after deletion)
CREATE OR REPLACE FUNCTION public.anonymize_user_data(user_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Anonymize audit logs (keep for compliance but remove PII)
  UPDATE public.audit_logs 
  SET 
    user_id = NULL,
    ip_address = NULL,
    user_agent = 'anonymized',
    details = CASE 
      WHEN details ? 'email' THEN details - 'email'
      ELSE details 
    END
  WHERE user_id = user_uuid;
  
  -- Log the anonymization
  INSERT INTO public.audit_logs (user_id, action, resource, outcome, risk_level, details)
  VALUES (
    NULL, -- Anonymous
    'gdpr.data_anonymized',
    'user_data',
    'success',
    'medium',
    json_build_object('original_user_id', user_uuid, 'anonymized_at', NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired data export requests
CREATE OR REPLACE FUNCTION public.cleanup_expired_data_exports()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.data_export_requests 
  WHERE 
    status = 'completed' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GDPR COMPLIANCE VIEWS
-- ============================================================================

-- View for consent dashboard (aggregated stats)
CREATE OR REPLACE VIEW public.consent_statistics AS
SELECT 
  consent_type,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE granted = true) as consented_users,
  ROUND(
    (COUNT(*) FILTER (WHERE granted = true)::numeric / COUNT(*) * 100), 2
  ) as consent_rate,
  MAX(updated_at) as last_updated
FROM public.user_consent 
WHERE NOT archived
GROUP BY consent_type;

-- View for data subject rights dashboard
CREATE OR REPLACE VIEW public.data_subject_rights_summary AS
SELECT 
  'data_export' as request_type,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  AVG(EXTRACT(EPOCH FROM (completed_at - requested_at))/86400) as avg_completion_days
FROM public.data_export_requests
UNION ALL
SELECT 
  'data_deletion' as request_type,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status IN ('pending', 'scheduled')) as pending,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  AVG(EXTRACT(EPOCH FROM (completed_at - requested_at))/86400) as avg_completion_days
FROM public.data_deletion_requests;

-- ============================================================================
-- INITIAL DATA PROCESSING ACTIVITIES
-- ============================================================================

INSERT INTO public.data_processing_activities (
  activity_name,
  purpose,
  legal_basis,
  data_categories,
  retention_period,
  recipients,
  third_countries
) VALUES 
(
  'User Account Management',
  'Creating and managing user accounts, authentication, and basic profile information',
  'contract',
  ARRAY['personal_data', 'contact_info', 'authentication_data'],
  INTERVAL '7 years',
  ARRAY['Internal staff'],
  ARRAY[]::text[]
),
(
  'CRM Data Processing',
  'Processing client and deal information for sales management purposes',
  'legitimate_interest',
  ARRAY['business_contact_info', 'sales_data', 'communication_records'],
  INTERVAL '5 years',
  ARRAY['Internal staff', 'Email service providers'],
  ARRAY[]::text[]
),
(
  'Analytics and Performance Monitoring',
  'Analyzing application usage to improve performance and user experience',
  'consent',
  ARRAY['usage_data', 'technical_data', 'performance_metrics'],
  INTERVAL '2 years',
  ARRAY['Analytics providers'],
  ARRAY['United States']
),
(
  'Marketing Communications',
  'Sending promotional emails and product updates to consented users',
  'consent',
  ARRAY['contact_info', 'preference_data'],
  INTERVAL '2 years',
  ARRAY['Email marketing providers'],
  ARRAY[]::text[]
),
(
  'Security and Audit Logging',
  'Maintaining security logs and audit trails for compliance and security monitoring',
  'legitimate_interest',
  ARRAY['technical_data', 'authentication_logs', 'access_logs'],
  INTERVAL '1 year',
  ARRAY['Security monitoring services'],
  ARRAY[]::text[]
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 GDPR COMPLIANCE SCHEMA SETUP COMPLETE!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ Data export requests table created';
  RAISE NOTICE '✅ Data deletion requests table created';
  RAISE NOTICE '✅ User consent management table created';
  RAISE NOTICE '✅ Privacy policy acceptance tracking created';
  RAISE NOTICE '✅ Data processing activities registered';
  RAISE NOTICE '✅ Row Level Security policies applied';
  RAISE NOTICE '✅ Compliance functions and views created';
  RAISE NOTICE '';
  RAISE NOTICE '📋 GDPR Rights Supported:';
  RAISE NOTICE '• Right to access (Article 15)';
  RAISE NOTICE '• Right to rectification (Article 16)';
  RAISE NOTICE '• Right to erasure (Article 17)';
  RAISE NOTICE '• Right to data portability (Article 20)';
  RAISE NOTICE '• Right to withdraw consent (Article 7)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Maintenance Functions:';
  RAISE NOTICE '• cleanup_expired_data_exports() - Run daily';
  RAISE NOTICE '• Process scheduled deletions - Run daily';
  RAISE NOTICE '• Review consent statistics - Monitor regularly';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Remember to:';
  RAISE NOTICE '• Update privacy policy when data processing changes';
  RAISE NOTICE '• Review data processing activities annually';
  RAISE NOTICE '• Train staff on GDPR procedures';
  RAISE NOTICE '• Implement data breach notification procedures';
  RAISE NOTICE '';
END $$;