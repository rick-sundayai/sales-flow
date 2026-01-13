-- Leads Table for Daily Stack (Tinder-style lead review)
-- This table stores incoming job leads that need to be reviewed by sales reps

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Job Details
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',

  -- Location
  location TEXT,
  remote_type TEXT CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),

  -- Summary & Details
  summary TEXT,
  description TEXT,
  requirements TEXT[],
  benefits TEXT[],

  -- Source & Enrichment
  source TEXT, -- where the lead came from (LinkedIn, Indeed, referral, etc.)
  source_url TEXT,
  is_enriched BOOLEAN DEFAULT false,
  enrichment_data JSONB, -- additional data from n8n enrichment

  -- Status & Actions
  status TEXT CHECK (status IN ('new', 'skipped', 'rejected', 'converted')) DEFAULT 'new',
  skipped_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_to_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Contact Information (if available)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Indexes for performance
  CONSTRAINT salary_range_valid CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads(assigned_to, status);

-- RLS Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Users can only see leads assigned to them
CREATE POLICY "Users can view their own leads"
  ON leads
  FOR SELECT
  USING (auth.uid() = assigned_to);

-- Users can update their own leads
CREATE POLICY "Users can update their own leads"
  ON leads
  FOR UPDATE
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

-- Users can insert leads (for testing/seeding)
CREATE POLICY "Users can insert leads"
  ON leads
  FOR INSERT
  WITH CHECK (auth.uid() = assigned_to);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Function to get new lead count for a user
CREATE OR REPLACE FUNCTION get_new_lead_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM leads
  WHERE assigned_to = user_id AND status = 'new';
$$ LANGUAGE sql SECURITY DEFINER;
