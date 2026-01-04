# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SalesFlow is a production-ready CRM application built with Next.js 15, Supabase, and TypeScript. The application provides comprehensive client relationship management, deal pipeline tracking, activity management, email composition, and calendar integration.

**Tech Stack**:
- **Framework**: Next.js 15 with App Router and Turbopack
- **Authentication**: Supabase Auth with SSR support
- **Database**: PostgreSQL via Supabase with comprehensive CRM schema
- **UI**: shadcn/ui components (50+ components) + TailwindCSS
- **State Management**: TanStack Query (React Query) for server state
- **Type Safety**: TypeScript with strict mode

## Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server with Turbopack (port 3000)
npm run build        # Build for production with Turbopack
npm run start        # Start production Next.js server

# Code Quality
npm run lint         # Run ESLint with Next.js rules
npm run type-check   # TypeScript compilation check (tsc --noEmit)
```

## Project Structure

```
SalesFlow/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── auth/              # Authentication pages (login, register, reset)
│   │   ├── dashboard/         # Protected CRM area
│   │   │   ├── activities/    # Activity tracking page
│   │   │   ├── automations/   # Automation settings
│   │   │   ├── calendar/      # Calendar/meetings view
│   │   │   ├── clients/       # Client management
│   │   │   ├── emails/        # Email management
│   │   │   ├── pipeline/      # Deal pipeline (Kanban view)
│   │   │   ├── settings/      # User settings
│   │   │   └── page.tsx       # Dashboard home
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles with CSS variables
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Public homepage
│   ├── components/
│   │   ├── auth/              # Auth forms (LoginForm, RegisterForm)
│   │   ├── crm/               # 15 CRM-specific components
│   │   ├── dashboard/         # Dashboard layout components
│   │   ├── layout/            # App shell components (Navbar, Sidebar)
│   │   └── ui/                # 50 shadcn/ui components
│   ├── hooks/                 # Custom React hooks (useAuth, useMounted)
│   ├── lib/
│   │   ├── auth/              # Authentication service
│   │   ├── providers/         # React Query provider
│   │   ├── queries/           # React Query hooks (6 query files)
│   │   ├── services/          # Business logic and API calls
│   │   ├── supabase/          # Supabase client configuration (client, server, middleware)
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── utils.ts           # cn() utility for class merging
│   └── middleware.ts          # Route protection and auth redirects
├── database/                  # SQL migration scripts
│   ├── setup.sql              # Initial user_profiles setup
│   ├── crm-schema.sql         # Complete CRM schema (clients, deals, activities, etc.)
│   ├── companyTable.sql       # Company table setup
│   └── seed.sql               # Seed data for testing
└── public/                    # Static assets
```

## Architecture

### Authentication Flow
- **Supabase Auth** with email/password authentication
- **Middleware** (`src/middleware.ts`) handles route protection:
  - Public routes: `/`, `/auth/*`
  - Protected routes: `/dashboard/*`
  - Authenticated users on `/` or `/auth/*` → redirect to `/dashboard`
  - Unauthenticated users on protected routes → redirect to `/auth/login`
- **Auth Context** (`src/hooks/useAuth.tsx`) provides auth state throughout the app

### Database Schema

The database uses a comprehensive CRM schema with the following core tables:

- **user_profiles** - Extended user data beyond Supabase auth (first_name, last_name, avatar_url)
- **clients** - Customer/prospect information (company_name, contact_name, email, phone, status, industry)
- **deals** - Sales opportunities (title, value, stage, probability, priority, expected_close_date)
- **activities** - Tracks emails, calls, meetings, tasks, notes (linked to clients/deals)
- **meetings** - Calendar events with Google Calendar integration
- **automations** - n8n workflow configurations
- **emails** - Gmail sync and email management

**Key Relationships**:
- `user_profiles` → `clients` → `deals` → `activities`
- `clients` → `meetings`, `emails`
- `user_profiles` → `automations`

**Security**:
- All tables use Row Level Security (RLS) policies for user data isolation
- Triggers for auto-timestamps, deal stage tracking, client contact updates
- Enums for type-safe status values (stages, priorities, activity types)

### State Management Pattern

Uses **TanStack Query** (React Query) for all server state:

```typescript
// Query hooks in src/lib/queries/
import { useClients, useAddClient } from '@/lib/queries/clients'
import { useDeals, useAddDeal } from '@/lib/queries/deals'
import { useActivities } from '@/lib/queries/activities'

// Usage in components
const { data: clients, isLoading } = useClients()
const addClient = useAddClient()
```

Query files are organized by domain:
- `clients.ts` - Client CRUD operations
- `deals.ts` - Deal/pipeline operations
- `activities.ts` - Activity tracking
- `dashboard.ts` - Dashboard metrics
- `meetings.ts` - Calendar/meeting operations

### Component Architecture

**shadcn/ui Configuration**:
- Style: "new-york"
- RSC: true (React Server Components)
- Base Color: Neutral
- CSS Variables: Enabled for theming
- Path aliases configured in `components.json`

**CRM Components** (`src/components/crm/`):
- `MetricCard.tsx` - Dashboard KPI cards
- `DealCard.tsx`, `PipelineColumn.tsx` - Kanban pipeline components
- `AddClientModal.tsx`, `AddDealModal.tsx` - Form modals for creating entities
- `ClientRow.tsx` - Client list item component
- `ActivityItem.tsx` - Activity timeline component
- `ComposeEmailModal.tsx` - Email composition
- `ScheduleMeetingModal.tsx` - Meeting scheduling
- `ai-email-composer.tsx` - AI-powered email generation (Google Gemini)
- `deal-drawer.tsx` - Deal detail drawer
- `deal-risk-analysis.tsx` - AI deal risk assessment

### Styling System

- **TailwindCSS** with custom configuration
- **CSS Variables** defined in `globals.css` for theming
- **Dark Mode** support with `next-themes`
- **Color Palette**: Professional CRM aesthetic
  - Background: `#191D24` (dark)
  - Surface: `#2D3748` (cards)
  - Primary: `#34D399` (mint green accent)
  - Border: `#4A5568`
  - Text: `#F5F5F5`

### Path Aliases

All imports use `@/*` path aliases:
```typescript
import { Button } from '@/components/ui/button'
import { useClients } from '@/lib/queries/clients'
import { createClient } from '@/lib/supabase/client'
```

Configured in:
- `tsconfig.json` - `"@/*": ["./src/*"]`
- `components.json` - shadcn/ui alias configuration

## Database Setup

1. Create a Supabase project
2. Copy `.env.example` to `.env.local` and add credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run SQL scripts in Supabase SQL Editor in order:
   - `database/setup.sql` - User profiles
   - `database/crm-schema.sql` - Complete CRM schema
   - `database/seed.sql` - (Optional) Test data

## AI Features

The application includes Google Gemini AI integration:

- **AI Email Composer** (`src/components/crm/ai-email-composer.tsx`)
  - Context-aware email generation
  - Tone selection (professional, casual, persuasive)
  - Deal-specific context injection

- **Deal Risk Analysis** (`src/components/crm/deal-risk-analysis.tsx`)
  - Analyzes deal probability and health
  - Provides actionable recommendations
  - Risk factor identification

Requires `NEXT_PUBLIC_GEMINI_API_KEY` environment variable.

## Key Implementation Patterns

### Server Components vs Client Components
- **Server Components** (default): Pages, layouts, data fetching
- **Client Components** (`'use client'`): Interactive forms, modals, state management
- Use server components for initial data loads, client components for interactivity

### Data Fetching Pattern
```typescript
// In server components (pages)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data } = await supabase.from('clients').select()

// In client components
import { useClients } from '@/lib/queries/clients'
const { data: clients } = useClients() // React Query with caching
```

### Modal Pattern
All modals use shadcn/ui Dialog component with consistent structure:
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

### Form Validation
Uses `react-hook-form` + `zod` for type-safe form validation:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ /* ... */ })
const form = useForm({
  resolver: zodResolver(schema)
})
```

## Development Notes

- **Hot Reload**: Turbopack provides fast refresh in development
- **Type Generation**: Supabase types can be auto-generated with Supabase CLI
- **Environment Variables**: All `NEXT_PUBLIC_*` vars are exposed to client
- **API Routes**: Use Next.js route handlers in `src/app/api/`
- **Real-time**: Supabase subscriptions available for live updates
- **Build**: Next.js production builds are optimized and cached

## Migration Context

This project evolved from a simple auth template (`talent-aether-auth-template`) into a full CRM application. The codebase maintains the original authentication foundation while adding comprehensive CRM functionality including client management, deal tracking, and activity monitoring.