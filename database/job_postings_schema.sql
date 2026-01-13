create table public.job_postings (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  company_id uuid null,
  title text not null,
  job_link text not null,
  location text null,
  salary_range text null,
  posted_date text null,
  description text null,
  priority_score integer null,
  priority_reasoning text null,
  status text null default 'new'::text,
  source text null default 'linkedin_scrape'::text,
  raw_data jsonb null,
  outreach_status text null default 'pending'::text,
  constraint job_postings_pkey primary key (id),
  constraint job_postings_job_link_key unique (job_link),
  constraint job_postings_company_id_fkey foreign KEY (company_id) references companies (id) on delete set null,
  constraint check_outreach_status check (
    (
      outreach_status = any (
        array[
          'pending'::text,
          'draft_created'::text,
          'sent'::text,
          'replied'::text,
          'bounced'::text
        ]
      )
    )
  ),
  constraint job_postings_status_check check (
    (
      status = any (
        array[
          'new'::text,
          'qualified'::text,
          'disqualified'::text,
          'contacted'::text,
          'interviewing'::text,
          'placed'::text,
          'closed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_job_link on public.job_postings using btree (job_link) TABLESPACE pg_default;

create index IF not exists idx_job_status on public.job_postings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_job_outreach_status on public.job_postings using btree (outreach_status) TABLESPACE pg_default;