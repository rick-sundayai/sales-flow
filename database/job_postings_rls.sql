-- Enable RLS on job_postings table
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to view job postings
CREATE POLICY "Allow authenticated users to view job postings"
ON public.job_postings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow all authenticated users to insert job postings
CREATE POLICY "Allow authenticated users to insert job postings"
ON public.job_postings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow all authenticated users to update job postings
CREATE POLICY "Allow authenticated users to update job postings"
ON public.job_postings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow all authenticated users to delete job postings
CREATE POLICY "Allow authenticated users to delete job postings"
ON public.job_postings
FOR DELETE
TO authenticated
USING (true);

-- Add helpful comment
COMMENT ON TABLE public.job_postings IS 'Job postings table with RLS policies allowing all authenticated users to manage leads';
