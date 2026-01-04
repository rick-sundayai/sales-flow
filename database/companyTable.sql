-- 1. Create the companies table
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  -- We make linkedin_url UNIQUE so n8n can 'Upsert' without creating duplicates
  linkedin_url text unique not null, 
  website_url text,
  logo_url text,
  employee_count integer,
  -- JSONB is perfect for the nested 'address' object { street, city... }
  address jsonb,  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable Security (Row Level Security)
alter table public.companies enable row level security;

-- 3. Create Policy: Allow n8n (Service Role) full access
-- The Service Role key bypasses RLS, but this policy ensures authenticated users can write if you change auth methods later.
create policy "Enable all access for authenticated users"
  on public.companies for all
  to authenticated
  using (true)
  with check (true);

-- 4. Create Policy: Allow public read access (Optional)
-- If you want your frontend to read this data without a user being logged in:
create policy "Enable read access for all users"
  on public.companies for select
  using (true);

-- 5. Create a function to auto-update the 'updated_at' timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 6. Attach the trigger to the table
create trigger on_companies_updated
  before update on public.companies
  for each row
  execute procedure public.handle_updated_at();