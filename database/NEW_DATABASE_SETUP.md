# Complete Database Setup Guide for New SalesFlow Database

## 🎯 Overview

This guide will set up a production-ready SalesFlow CRM database with enterprise security features including:
- Complete CRM tables (clients, deals, activities, etc.)
- Two-factor authentication system
- Comprehensive audit logging
- GDPR compliance features
- Row-level security on all tables

## 📋 Prerequisites

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and update these **required** variables:

```bash
# Your new Supabase database
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security configuration (generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
```

### 2. Database Access

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **new** project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

## 🚀 Database Setup Steps

### Phase 1: Core Foundation

#### Step 1: User Authentication Setup
```sql
-- Copy and paste the entire contents of setup.sql
-- This creates user_profiles table and authentication triggers
```

**File:** `setup.sql`

**Expected Output:**
```
🎉 SUPABASE AUTH SETUP COMPLETE!
✅ User profiles table created
✅ Row Level Security enabled
✅ Automatic profile creation configured
✅ Performance indexes added
```

#### Step 2: Add User Roles
```sql
-- Add role field to user_profiles for permission management
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user'));

-- Add index for role queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Update the trigger function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    'user'  -- Default role for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: CRM Core Tables

#### Step 3: CRM Schema Setup
```sql
-- Copy and paste the entire contents of crm-schema.sql
-- This creates all main CRM tables with security and performance optimizations
```

**File:** `crm-schema.sql`

**Expected Output:**
```
🎉 CRM SCHEMA SETUP COMPLETE!
✅ Tables created: clients, deals, activities, meetings, automations, emails
✅ Row Level Security enabled on all tables
✅ Triggers configured for timestamps and webhooks
✅ Performance indexes added
✅ Helpful views created
```

#### Step 4: Company Management
```sql
-- Copy and paste the entire contents of companyTable.sql
-- This adds B2B company management capabilities
```

**File:** `companyTable.sql`

### Phase 3: Security Features

#### Step 5: Two-Factor Authentication
```sql
-- Copy and paste the entire contents of add-2fa-fields.sql
-- This adds comprehensive 2FA support with audit logging
```

**File:** `add-2fa-fields.sql`

**Expected Output:**
```
🔐 TWO-FACTOR AUTHENTICATION SETUP COMPLETE!
✅ 2FA fields added to user_profiles table
✅ Security functions created
✅ Audit logging table created
✅ Cleanup functions added
```

#### Step 6: Audit Logging System
```sql
-- Copy and paste the entire contents of audit-logs-schema.sql
-- This creates comprehensive audit trail for compliance
```

**File:** `audit-logs-schema.sql`

**Expected Output:**
```
📋 AUDIT LOGGING SYSTEM SETUP COMPLETE!
✅ Audit logs table created with RLS
✅ Performance indexes optimized
✅ Security detection functions added
✅ Compliance reporting views created
```

### Phase 4: Compliance Features

#### Step 7: GDPR Compliance
```sql
-- Copy and paste the entire contents of gdpr-compliance-schema.sql
-- This adds data privacy and GDPR compliance features
```

**File:** `gdpr-compliance-schema.sql`

**Expected Output:**
```
🔒 GDPR COMPLIANCE SCHEMA SETUP COMPLETE!
✅ Data export requests table created
✅ Data deletion requests table created
✅ User consent management table created
✅ Privacy policy acceptance tracking created
✅ Compliance functions and views created
```

## ✅ Verification

### Step 8: Verify Installation

Run this query to confirm all tables are created:

```sql
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected Tables:**
```
- activities
- audit_logs
- clients
- companies
- data_deletion_requests
- data_export_requests
- deals
- emails
- meetings
- privacy_policy_acceptance
- two_factor_audit_log
- user_consent
- user_profiles
```

### Step 9: Test RLS Policies

```sql
-- This should return your user profile
SELECT * FROM public.user_profiles WHERE user_id = auth.uid();

-- This should return empty (no data yet)
SELECT COUNT(*) as client_count FROM public.clients;
SELECT COUNT(*) as deal_count FROM public.deals;
SELECT COUNT(*) as activity_count FROM public.activities;
```

## 🔧 Post-Setup Configuration

### Generate TypeScript Types

```bash
cd /Users/richardlove/Desktop/Projects/StaffingPro/SalesFlow

# Install Supabase CLI if needed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Generate types
supabase gen types typescript --linked > src/lib/types/database.types.ts
```

### Environment Validation

Run the environment validation script:

```bash
node scripts/validate-env.js
```

## 🚨 Important Notes

### Security Considerations
- **No seed data** - Database will be empty as requested
- **Row Level Security** - All tables are secured by user isolation
- **Service Role Key** - Keep this secret and only use server-side
- **2FA Setup** - Users must enable 2FA through the UI
- **Audit Logging** - All sensitive operations are automatically logged

### Performance Features
- **Optimized Indexes** - 20+ indexes for fast queries
- **GIN Indexes** - 150x faster array searches
- **Helper Views** - Pre-computed aggregations
- **Connection Pooling** - Supabase handles this automatically

### Compliance Features
- **GDPR Ready** - Data export, deletion, and consent management
- **Audit Trail** - Complete activity logging for compliance
- **Data Retention** - Automatic cleanup functions included
- **Privacy Controls** - User consent tracking and management

## 🆘 Troubleshooting

### Common Issues

**Error: "relation already exists"**
- This is safe to ignore if re-running scripts
- All scripts use `IF NOT EXISTS` for safety

**Error: "permission denied for schema auth"**
- This is expected - auth schema is managed by Supabase
- Your tables are in the public schema

**RLS blocking queries**
- Ensure you're using authenticated Supabase client
- Check that user is properly signed in
- Use `supabase.from('table').select()` not raw SQL

**2FA functions not working**
- Ensure you've run add-2fa-fields.sql completely
- Check that user_profiles table has new 2FA columns

### Validation Queries

Check table permissions:
```sql
SELECT tablename, tableowner, hasrls 
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE t.schemaname = 'public' AND n.nspname = 'public';
```

Check RLS policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🎯 Next Steps

After database setup is complete:

1. ✅ **Database Ready** - All schemas installed
2. ⏭️ **Update Application** - Restart Next.js app with new env vars
3. ⏭️ **Test Authentication** - Sign up/in to create user profile
4. ⏭️ **Test Features** - Create clients, deals, activities
5. ⏭️ **Enable Security** - Set up 2FA, review audit logs
6. ⏭️ **Production Deploy** - Deploy with proper security configuration

## 📚 Documentation References

- **Main Database Docs:** [README.md](./README.md)
- **Quick Start Guide:** [QUICK_START.md](./QUICK_START.md)
- **Migration Plan:** [../MIGRATION_PLAN.md](../MIGRATION_PLAN.md)
- **Production Fixes:** [PRODUCTION_FIXES.md](./PRODUCTION_FIXES.md)

---

**🔒 Security Note:** This setup includes enterprise-grade security features. Make sure to:
- Use strong secrets in production
- Enable 2FA for admin accounts
- Regularly review audit logs
- Follow GDPR compliance procedures
- Keep Supabase service role key secure