-- ============================================================================
-- CRM SEED DATA FOR SALESFLOW
-- Populates the database with realistic test data for development
-- Run this AFTER crm-schema.sql
-- ============================================================================

-- ============================================================================
-- AUTO-DETECT USER ID
-- Automatically gets the first user's ID from auth.users
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first user's ID (usually your account)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found! Please create a user account first by signing up in your app.';
  END IF;

  RAISE NOTICE 'Using user ID: %', v_user_id;

  -- ============================================================================
  -- SEED CLIENTS
  -- ============================================================================

  INSERT INTO public.clients (user_id, contact_name, email, phone, company_name, industry, website, status, last_contact_at, created_at) VALUES
    (v_user_id, 'Sarah Johnson', 'sarah@acme.com', '+1 (555) 123-4567', 'Acme Corporation', 'Technology', 'https://acme.com', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 months'),
    (v_user_id, 'Michael Chen', 'mchen@techstart.io', '+1 (555) 987-6543', 'TechStart Inc', 'SaaS', 'https://techstart.io', 'active', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 months'),
    (v_user_id, 'Emily Davis', 'emily.d@growthlabs.com', '+1 (555) 456-7890', 'Growth Labs', 'Marketing', 'https://growthlabs.com', 'prospect', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 months'),
    (v_user_id, 'Robert Kim', 'rkim@dataflow.systems', '+1 (555) 321-9876', 'DataFlow Systems', 'Data Analytics', 'https://dataflow.systems', 'active', NOW() - INTERVAL '1 week', NOW() - INTERVAL '8 months'),
    (v_user_id, 'Anna Martinez', 'anna@quantum.solutions', '+1 (555) 654-3210', 'Quantum Solutions', 'Consulting', 'https://quantum.solutions', 'active', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 months'),
    (v_user_id, 'Tom Wilson', 'tom@startupxyz.com', '+1 (555) 789-0123', 'StartupXYZ', 'E-commerce', 'https://startupxyz.com', 'prospect', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 months'),
    (v_user_id, 'Lisa Park', 'lisa@localbiz.inc', '+1 (555) 234-5678', 'LocalBiz Inc', 'Retail', 'https://localbiz.inc', 'inactive', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '1 year'),
    (v_user_id, 'David Rodriguez', 'david@innovate.co', '+1 (555) 567-8901', 'InnovateCo', 'Technology', 'https://innovate.co', 'active', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 months'),
    (v_user_id, 'Jessica Lee', 'jlee@cloudnine.app', '+1 (555) 890-1234', 'CloudNine', 'Cloud Services', 'https://cloudnine.app', 'prospect', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 month'),
    (v_user_id, 'Marcus Thompson', 'marcus@enterprise.tech', '+1 (555) 345-6789', 'EnterpriseTech', 'Enterprise Software', 'https://enterprise.tech', 'active', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '7 months'),
    (v_user_id, 'Rachel Green', 'rachel@fastgrow.io', '+1 (555) 678-9012', 'FastGrow', 'Startup Incubator', 'https://fastgrow.io', 'prospect', NOW() - INTERVAL '1 week', NOW() - INTERVAL '2 months'),
    (v_user_id, 'James Anderson', 'james@secure.tech', '+1 (555) 901-2345', 'SecureTech', 'Cybersecurity', 'https://secure.tech', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '9 months'),
    (v_user_id, 'Sophia Williams', 'sophia@digital.agency', '+1 (555) 123-9876', 'Digital Agency Co', 'Marketing', 'https://digital.agency', 'active', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 months'),
    (v_user_id, 'Daniel Brown', 'dan@scale.systems', '+1 (555) 456-1234', 'ScaleSystems', 'Infrastructure', 'https://scale.systems', 'prospect', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 month'),
    (v_user_id, 'Olivia Taylor', 'olivia@ai.ventures', '+1 (555) 789-4567', 'AI Ventures', 'Artificial Intelligence', 'https://ai.ventures', 'active', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '6 months');

  -- ============================================================================
  -- SEED DEALS
  -- Distributed across all pipeline stages
  -- ============================================================================

  INSERT INTO public.deals (user_id, client_id, title, description, value, stage, probability, priority, expected_close_date, created_at) VALUES
    -- LEAD stage
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'tom@startupxyz.com' AND user_id = v_user_id), 'Website Redesign', 'Complete website overhaul with modern design', 15000, 'lead', 20, 'low', CURRENT_DATE + INTERVAL '45 days', NOW() - INTERVAL '1 week'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'lisa@localbiz.inc' AND user_id = v_user_id), 'Marketing Automation Setup', 'Email marketing and automation platform', 8500, 'lead', 15, 'low', CURRENT_DATE + INTERVAL '50 days', NOW() - INTERVAL '5 days'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'rachel@fastgrow.io' AND user_id = v_user_id), 'CRM Implementation', 'Custom CRM system for startup portfolio', 22000, 'lead', 25, 'medium', CURRENT_DATE + INTERVAL '60 days', NOW() - INTERVAL '3 days'),

    -- QUALIFIED stage
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'sarah@acme.com' AND user_id = v_user_id), 'Enterprise Software License', 'Annual enterprise license for 500 users', 75000, 'qualified', 75, 'high', CURRENT_DATE + INTERVAL '15 days', NOW() - INTERVAL '3 weeks'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'mchen@techstart.io' AND user_id = v_user_id), 'Consulting Services Package', 'Q1 2025 consulting retainer', 35000, 'qualified', 60, 'medium', CURRENT_DATE + INTERVAL '20 days', NOW() - INTERVAL '2 weeks'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'jlee@cloudnine.app' AND user_id = v_user_id), 'Cloud Migration Project', 'AWS to Azure migration consulting', 48000, 'qualified', 65, 'high', CURRENT_DATE + INTERVAL '30 days', NOW() - INTERVAL '10 days'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'sophia@digital.agency' AND user_id = v_user_id), 'SEO Optimization Package', 'Comprehensive SEO audit and optimization', 12000, 'qualified', 70, 'medium', CURRENT_DATE + INTERVAL '25 days', NOW() - INTERVAL '8 days'),

    -- PROPOSAL stage
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'emily.d@growthlabs.com' AND user_id = v_user_id), 'Annual Support Contract', '24/7 premium support package', 48000, 'proposal', 80, 'high', CURRENT_DATE + INTERVAL '10 days', NOW() - INTERVAL '1 month'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'marcus@enterprise.tech' AND user_id = v_user_id), 'API Integration Services', 'Custom API development and integration', 62000, 'proposal', 75, 'high', CURRENT_DATE + INTERVAL '12 days', NOW() - INTERVAL '3 weeks'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'david@innovate.co' AND user_id = v_user_id), 'Mobile App Development', 'iOS and Android app development', 95000, 'proposal', 70, 'high', CURRENT_DATE + INTERVAL '18 days', NOW() - INTERVAL '2 weeks'),

    -- NEGOTIATION stage
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'rkim@dataflow.systems' AND user_id = v_user_id), 'Platform Integration', 'Multi-platform data integration solution', 92000, 'negotiation', 85, 'high', CURRENT_DATE + INTERVAL '8 days', NOW() - INTERVAL '6 weeks'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'james@secure.tech' AND user_id = v_user_id), 'Security Audit & Implementation', 'Comprehensive security assessment', 58000, 'negotiation', 90, 'high', CURRENT_DATE + INTERVAL '5 days', NOW() - INTERVAL '5 weeks'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'olivia@ai.ventures' AND user_id = v_user_id), 'AI Model Training', 'Custom ML model development', 125000, 'negotiation', 80, 'high', CURRENT_DATE + INTERVAL '7 days', NOW() - INTERVAL '1 month'),

    -- CLOSED WON stage
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'anna@quantum.solutions' AND user_id = v_user_id), 'Security Audit Services', 'Annual security audit completed', 45000, 'closed_won', 100, 'medium', CURRENT_DATE - INTERVAL '4 days', NOW() - INTERVAL '2 months'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'sarah@acme.com' AND user_id = v_user_id), 'Training Program', 'Employee training and onboarding', 18000, 'closed_won', 100, 'low', CURRENT_DATE - INTERVAL '10 days', NOW() - INTERVAL '3 months'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'marcus@enterprise.tech' AND user_id = v_user_id), 'Infrastructure Upgrade', 'Server infrastructure modernization', 78000, 'closed_won', 100, 'high', CURRENT_DATE - INTERVAL '15 days', NOW() - INTERVAL '4 months'),

    -- CLOSED LOST stage
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'dan@scale.systems' AND user_id = v_user_id), 'Custom Development', 'Bespoke software solution', 155000, 'closed_lost', 0, 'high', CURRENT_DATE - INTERVAL '20 days', NOW() - INTERVAL '2 months'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'jlee@cloudnine.app' AND user_id = v_user_id), 'Managed Services', 'Monthly managed IT services', 24000, 'closed_lost', 0, 'medium', CURRENT_DATE - INTERVAL '30 days', NOW() - INTERVAL '3 months');

  -- ============================================================================
  -- SEED ACTIVITIES
  -- Mix of emails, calls, meetings, tasks, and notes
  -- ============================================================================

  INSERT INTO public.activities (user_id, client_id, deal_id, type, title, description, completed, created_at) VALUES
    -- Recent activities (last 24 hours)
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'sarah@acme.com' AND user_id = v_user_id), NULL, 'email', 'Sent proposal to Acme Corp', 'Q1 2025 service package with volume pricing', true, NOW() - INTERVAL '1 hour'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'mchen@techstart.io' AND user_id = v_user_id), NULL, 'call', 'Discovery call with TechStart', 'Discussed pain points and potential solutions', true, NOW() - INTERVAL '3 hours'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'sophia@digital.agency' AND user_id = v_user_id), NULL, 'meeting', 'Product demo scheduled', 'Scheduled product walkthrough for next week', false, NOW() - INTERVAL '5 hours'),

    -- Yesterday
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'emily.d@growthlabs.com' AND user_id = v_user_id), NULL, 'meeting', 'Product demo with Growth Labs', 'Demonstrated new features and ROI', true, NOW() - INTERVAL '1 day'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'anna@quantum.solutions' AND user_id = v_user_id), (SELECT id FROM public.deals WHERE title = 'Security Audit Services' AND user_id = v_user_id), 'task', 'Contract signed - Quantum Solutions', '$45,000 annual deal closed', true, NOW() - INTERVAL '1 day'),

    -- Last week
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'rkim@dataflow.systems' AND user_id = v_user_id), NULL, 'email', 'Follow-up email to DataFlow', 'Sent pricing breakdown and timeline', true, NOW() - INTERVAL '3 days'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'james@secure.tech' AND user_id = v_user_id), NULL, 'call', 'Technical requirements call', 'Discussed security audit scope', true, NOW() - INTERVAL '4 days'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'david@innovate.co' AND user_id = v_user_id), NULL, 'note', 'Client interested in mobile app', 'Expressed strong interest in iOS/Android development', false, NOW() - INTERVAL '5 days'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'marcus@enterprise.tech' AND user_id = v_user_id), NULL, 'task', 'Prepare proposal for EnterpriseTech', 'Draft comprehensive proposal document', true, NOW() - INTERVAL '6 days'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'olivia@ai.ventures' AND user_id = v_user_id), NULL, 'email', 'Introduction email to AI Ventures', 'Initial outreach and capability overview', true, NOW() - INTERVAL '7 days');

  -- ============================================================================
  -- SEED MEETINGS
  -- Upcoming and past meetings
  -- ============================================================================

  INSERT INTO public.meetings (user_id, client_id, title, description, attendees, start_time, end_time, meeting_type, location, status, created_at) VALUES
    -- Today's meetings (scheduled at 2 PM)
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'sarah@acme.com' AND user_id = v_user_id), 'Product Demo - Acme Corp', 'Comprehensive product walkthrough', ARRAY['sarah@acme.com'], (CURRENT_DATE + INTERVAL '14 hours'), (CURRENT_DATE + INTERVAL '14 hours 30 minutes'), 'video', 'Google Meet', 'scheduled', NOW() - INTERVAL '2 days'),

    -- Tomorrow's meetings (scheduled at 10 AM)
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'mchen@techstart.io' AND user_id = v_user_id), 'Contract Review', 'Review and finalize contract terms', ARRAY['mchen@techstart.io'], (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours'), (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '11 hours'), 'in-person', 'TechStart Office, Downtown', 'scheduled', NOW() - INTERVAL '1 day'),

    -- Later this week (scheduled at reasonable business hours)
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'emily.d@growthlabs.com' AND user_id = v_user_id), 'Quarterly Check-in', 'Q4 performance review and Q1 planning', ARRAY['emily.d@growthlabs.com'], (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours'), (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours 45 minutes'), 'video', 'Zoom', 'scheduled', NOW() - INTERVAL '3 days'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'rkim@dataflow.systems' AND user_id = v_user_id), 'Technical Deep Dive', 'Platform integration architecture discussion', ARRAY['rkim@dataflow.systems', 'tech@dataflow.systems'], (CURRENT_DATE + INTERVAL '4 days' + INTERVAL '15 hours'), (CURRENT_DATE + INTERVAL '4 days' + INTERVAL '16 hours 30 minutes'), 'video', 'Microsoft Teams', 'scheduled', NOW() - INTERVAL '1 week'),

    -- Past meetings (scheduled at reasonable business hours)
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'james@secure.tech' AND user_id = v_user_id), 'Security Requirements Meeting', 'Discussed audit scope and compliance needs', ARRAY['james@secure.tech'], (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '9 hours'), (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '10 hours'), 'video', 'Google Meet', 'completed', NOW() - INTERVAL '1 week'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'olivia@ai.ventures' AND user_id = v_user_id), 'Initial Discovery Call', 'Understanding AI model requirements', ARRAY['olivia@ai.ventures'], (CURRENT_DATE - INTERVAL '5 days' + INTERVAL '11 hours'), (CURRENT_DATE - INTERVAL '5 days' + INTERVAL '11 hours 30 minutes'), 'phone', 'Phone Call', 'completed', NOW() - INTERVAL '2 weeks'),
    (v_user_id, (SELECT id FROM public.clients WHERE email = 'marcus@enterprise.tech' AND user_id = v_user_id), 'API Integration Workshop', 'Technical workshop for API requirements', ARRAY['marcus@enterprise.tech', 'dev@enterprise.tech'], (CURRENT_DATE - INTERVAL '1 week' + INTERVAL '10 hours'), (CURRENT_DATE - INTERVAL '1 week' + INTERVAL '12 hours'), 'in-person', 'EnterpriseTech HQ', 'completed', NOW() - INTERVAL '3 weeks');

  -- ============================================================================
  -- SEED AUTOMATIONS
  -- n8n workflow configurations
  -- ============================================================================

  INSERT INTO public.automations (user_id, name, description, trigger_type, action_type, is_active, total_runs, last_run_at, created_at) VALUES
    (v_user_id, 'Follow-up Reminder', 'Send reminder email 3 days after no response', 'no_response_3_days', 'send_email', true, 47, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 months'),
    (v_user_id, 'Deal Stage Notification', 'Notify team when deal moves to Negotiation', 'deal_stage_changed', 'slack_notification', true, 23, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 month'),
    (v_user_id, 'Meeting Summary Generator', 'Generate AI summary after each meeting', 'meeting_completed', 'create_note', false, 12, NOW() - INTERVAL '1 week', NOW() - INTERVAL '3 months'),
    (v_user_id, 'New Lead Alert', 'Alert when high-value lead is created', 'new_lead_high_value', 'send_notification', true, 8, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 month'),
    (v_user_id, 'Contract Expiry Warning', 'Warn 30 days before contract expiry', 'contract_expiring', 'send_email', true, 5, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 months');

  RAISE NOTICE '';
  RAISE NOTICE '🎉 SEED DATA INSERTED SUCCESSFULLY!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '✅ 15 Clients created';
  RAISE NOTICE '✅ 18 Deals created (across all pipeline stages)';
  RAISE NOTICE '✅ 10 Activities created';
  RAISE NOTICE '✅ 7 Meetings created (upcoming and past)';
  RAISE NOTICE '✅ 5 Automations created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your CRM is now populated with test data!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Lead stage: 3 deals';
  RAISE NOTICE '   - Qualified stage: 4 deals';
  RAISE NOTICE '   - Proposal stage: 3 deals';
  RAISE NOTICE '   - Negotiation stage: 3 deals';
  RAISE NOTICE '   - Closed Won: 3 deals';
  RAISE NOTICE '   - Closed Lost: 2 deals';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Total pipeline value: ~$1,000,000';
  RAISE NOTICE '';
END $$;
