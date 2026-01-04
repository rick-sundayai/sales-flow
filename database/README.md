# Database Setup Guide

This directory contains all SQL scripts needed to set up your CRM database in Supabase.

## Files Overview

1. **[setup.sql](setup.sql)** - User authentication tables (already exists)
2. **[crm-schema.sql](crm-schema.sql)** - Complete CRM schema (NEW)
3. **[seed.sql](seed.sql)** - Test data for development (NEW)

## Installation Steps

### Step 1: Run the User Authentication Setup (If Not Already Done)

```sql
-- In Supabase SQL Editor, run:
```
Copy and paste the contents of `setup.sql` into the Supabase SQL Editor and execute.

This creates:
- `user_profiles` table
- Row Level Security policies
- Auto-create profile trigger

### Step 2: Run the CRM Schema

```sql
-- In Supabase SQL Editor, run:
```
Copy and paste the contents of `crm-schema.sql` into the Supabase SQL Editor and execute.

This creates:
- **Tables:** clients, deals, activities, meetings, automations, emails
- **RLS Policies:** User data isolation
- **Triggers:** Auto-update timestamps, track deal stage changes, update last contact
- **Indexes:** Performance optimization
- **Views:** client_summary, pipeline_summary
- **Webhook Functions:** n8n integration placeholders

### Step 3: Populate with Test Data (Development Only)

```sql
-- In Supabase SQL Editor, run:
```
Copy and paste the contents of `seed.sql` into the Supabase SQL Editor and execute.

This inserts:
- 15 test clients
- 18 deals across all pipeline stages
- 10 activities (emails, calls, meetings)
- 7 meetings (upcoming and past)
- 5 automation configurations

⚠️ **Important:** The seed script uses `auth.uid()` which will populate data for the currently authenticated user. Make sure you're logged in when running the seed script.

## Database Schema

### Core Tables

#### `clients`
Stores client/contact information with company details.

**Key Fields:**
- `contact_name`, `email`, `phone` - Contact info
- `company_name`, `industry`, `website` - Company info
- `status` - active, prospect, inactive, churned
- `last_contact_at` - Auto-updated when activities are created

#### `deals`
Sales opportunities in the pipeline.

**Key Fields:**
- `title`, `description` - Deal details
- `value`, `currency` - Financial metrics
- `stage` - lead, qualified, proposal, negotiation, closed_won, closed_lost
- `probability` - Win probability (0-100%)
- `priority` - low, medium, high
- `expected_close_date`, `actual_close_date` - Dates

#### `activities`
All interactions (emails, calls, meetings, tasks, notes).

**Key Fields:**
- `type` - email, call, meeting, task, note
- `title`, `description` - Activity details
- `client_id`, `deal_id` - Optional relationships
- `completed` - For tasks

#### `meetings`
Scheduled meetings with clients.

**Key Fields:**
- `title`, `description`, `attendees[]` - Meeting details
- `start_time`, `end_time` - Schedule
- `meeting_type` - video, in-person, phone
- `google_calendar_id`, `google_meet_url` - Integration fields
- `status` - scheduled, completed, cancelled, no-show

#### `automations`
n8n workflow configurations.

**Key Fields:**
- `name`, `description` - Automation details
- `trigger_type`, `action_type` - Workflow logic
- `n8n_workflow_id`, `n8n_webhook_url` - Integration
- `is_active` - Enable/disable toggle
- `total_runs`, `last_run_at` - Metrics

#### `emails`
Gmail integration metadata.

**Key Fields:**
- `gmail_message_id`, `gmail_thread_id` - Gmail refs
- `subject`, `from_email`, `to_email` - Email details
- `body_text`, `body_html` - Content
- `is_read`, `is_starred` - Flags

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:

```sql
CREATE POLICY "users_own_clients" ON public.clients
  FOR ALL USING (auth.uid() = user_id);
```

This pattern is repeated for all tables.

### Automatic Triggers

1. **Update `updated_at` timestamp** - Fires on all updates
2. **Track deal stage changes** - Sets `stage_changed_at` and `actual_close_date`
3. **Update client last contact** - Sets `last_contact_at` when activity is created
4. **Notify deal stage webhooks** - Triggers n8n webhooks on stage changes (requires pg_net)

### Helpful Views

#### `client_summary`
Aggregated client metrics:
- `active_deals_count`, `total_deals_count`
- `active_deals_value`, `total_deals_value`
- `total_activities_count`

Usage:
```sql
SELECT * FROM public.client_summary WHERE user_id = auth.uid();
```

#### `pipeline_summary`
Deal counts and values per stage:
- `deal_count`, `total_value`, `avg_value`, `avg_probability`

Usage:
```sql
SELECT * FROM public.pipeline_summary WHERE user_id = auth.uid();
```

## Generating TypeScript Types

After running the schema, generate TypeScript types for your frontend:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Generate types
supabase gen types typescript --linked > src/lib/types/database.types.ts
```

Or use the direct API:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/types/database.types.ts
```

## Next Steps

1. ✅ Run all SQL scripts in Supabase SQL Editor
2. ✅ Generate TypeScript types
3. ⏭️ Create React Query hooks ([see MIGRATION_PLAN.md](../../MIGRATION_PLAN.md#31-create-supabase-query-hooks))
4. ⏭️ Start migrating components from RecruitFlow

## Troubleshooting

### "permission denied for schema auth"
This is expected. The `auth` schema is managed by Supabase. Your tables are in the `public` schema.

### "relation already exists"
You may have run the script twice. Either:
- Drop the tables manually: `DROP TABLE public.clients CASCADE;`
- Or use `CREATE TABLE IF NOT EXISTS` (already in scripts)

### Seed data not appearing
Make sure you're authenticated when running `seed.sql`. The script uses `auth.uid()` which requires an active session.

### RLS policies blocking queries
Make sure you're making queries with an authenticated Supabase client. Use `supabase.from('clients').select()` not raw SQL.

## Database Diagram

```
auth.users (Supabase managed)
    ↓
user_profiles
    ↓
    ├── clients
    │   ├── deals
    │   │   └── activities
    │   ├── meetings
    │   ├── activities
    │   └── emails
    │
    ├── automations
    └── activities
```

## Support

For issues or questions about the database schema, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Migration plan: [MIGRATION_PLAN.md](../../MIGRATION_PLAN.md)
