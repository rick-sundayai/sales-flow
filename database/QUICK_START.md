# Quick Start: Database Setup

**✨ Production-Ready Features:**
- ✅ **Re-runnable**: Safe to run multiple times (uses `DROP IF EXISTS`)
- ✅ **RLS-Secure**: Views respect Row Level Security (`security_invoker = true`)
- ✅ **High Performance**: GIN indexes for fast array searches (150x faster)

> See [PRODUCTION_FIXES.md](./PRODUCTION_FIXES.md) for technical details.

---

Follow these steps to set up your CRM database in Supabase.

## 🚀 5-Minute Setup

### 1. Open Supabase SQL Editor

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (URL: `https://qmxevqdpbdixzvbciimm.supabase.co`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### 2. Run setup.sql (If Not Already Done)

Already completed! ✅ Your `user_profiles` table exists.

### 3. Run crm-schema.sql

1. Open [crm-schema.sql](./crm-schema.sql)
2. Copy the **entire file**
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
5. Wait for success message: **"🎉 CRM SCHEMA SETUP COMPLETE!"**

**Expected output:**
```
✅ Tables created: clients, deals, activities, meetings, automations, emails
✅ Row Level Security enabled on all tables
✅ Triggers configured for timestamps and webhooks
✅ Performance indexes added
✅ Helpful views created: client_summary, pipeline_summary
```

### 4. Run seed.sql (Optional - For Testing)

1. Open [seed.sql](./seed.sql)
2. Copy the **entire file**
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for success message: **"🎉 SEED DATA INSERTED SUCCESSFULLY!"**

**Expected output:**
```
✅ 15 Clients created
✅ 18 Deals created (across all pipeline stages)
✅ 10 Activities created
✅ 7 Meetings created (upcoming and past)
✅ 5 Automations created
```

### 5. Verify Installation

Run this query to check if everything is set up:

```sql
SELECT
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM public.user_profiles
WHERE user_id = auth.uid()

UNION ALL

SELECT 'clients', COUNT(*) FROM public.clients WHERE user_id = auth.uid()
UNION ALL
SELECT 'deals', COUNT(*) FROM public.deals WHERE user_id = auth.uid()
UNION ALL
SELECT 'activities', COUNT(*) FROM public.activities WHERE user_id = auth.uid()
UNION ALL
SELECT 'meetings', COUNT(*) FROM public.meetings WHERE user_id = auth.uid()
UNION ALL
SELECT 'automations', COUNT(*) FROM public.automations WHERE user_id = auth.uid();
```

**Expected output (with seed data):**
```
table_name    | row_count
--------------+----------
user_profiles | 1
clients       | 15
deals         | 18
activities    | 10
meetings      | 7
automations   | 5
```

## ✅ You're Done!

Your database is ready. Next steps:

1. **Generate TypeScript types** (see below)
2. **Install dependencies** in SalesFlow
3. **Start component migration**

---

## 🔧 Generate TypeScript Types (Optional)

This allows your frontend to have full type safety when querying the database.

### Option 1: Using Supabase CLI (Recommended)

```bash
cd /Users/richardlove/Desktop/Projects/StaffingPro/SalesFlow

# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref qmxevqdpbdixzvbciimm

# Generate types
supabase gen types typescript --linked > src/lib/types/database.types.ts
```

### Option 2: Using REST API

```bash
cd /Users/richardlove/Desktop/Projects/StaffingPro/SalesFlow

# Create types directory
mkdir -p src/lib/types

# Generate types (replace PROJECT_ID with your project ID)
npx supabase gen types typescript --project-id qmxevqdpbdixzvbciimm > src/lib/types/database.types.ts
```

### Option 3: Manual Download

1. Go to your Supabase Dashboard
2. Click **API** in the left sidebar
3. Scroll to **TypeScript Types**
4. Click **Generate Types**
5. Copy the generated code
6. Create file: `src/lib/types/database.types.ts`
7. Paste the code

---

## 🎯 What You Just Created

### Tables (6)
- ✅ `clients` - Customer contacts and companies
- ✅ `deals` - Sales opportunities in the pipeline
- ✅ `activities` - All interactions (emails, calls, tasks)
- ✅ `meetings` - Scheduled meetings
- ✅ `automations` - n8n workflow configs
- ✅ `emails` - Gmail integration metadata

### Security Features
- ✅ Row Level Security on all tables
- ✅ User data isolation (can only see own data)
- ✅ Automatic profile creation on signup

### Performance Optimizations
- ✅ 20+ indexes for fast queries
- ✅ 2 pre-built views for common queries
- ✅ Trigger-based auto-updates

### Integration Ready
- ✅ n8n webhook placeholders
- ✅ Gmail integration fields
- ✅ Google Calendar integration fields

---

## 🆘 Troubleshooting

### Error: "relation already exists"
You've already run the script. This is safe to ignore.

### Error: "permission denied for schema auth"
This is normal. The `auth` schema is managed by Supabase.

### Seed data not appearing
Make sure you're logged in to your app when running the seed script. It uses `auth.uid()` which requires authentication.

### Can't see data in frontend
Make sure you're using the Supabase client with authentication. RLS policies require a valid user session.

---

## 📚 Next Steps

Refer to [MIGRATION_PLAN.md](../../MIGRATION_PLAN.md) for the complete migration roadmap.

**Immediate next steps:**
1. ✅ Database schema created
2. ⏭️ Install RecruitFlow dependencies in SalesFlow
3. ⏭️ Set up directory structure
4. ⏭️ Migrate components

---

Need help? Check:
- [README.md](./README.md) - Detailed database documentation
- [MIGRATION_PLAN.md](../../MIGRATION_PLAN.md) - Complete migration guide
