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

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode  
npm run test:coverage # Run tests with coverage report
npm run test:ui      # Run tests in watch mode with verbose output
npm run test:ci      # Run tests in CI mode with coverage

# Build Analysis & Database
npm run build:analyze # Analyze bundle size
npm run db:generate-types # Generate Supabase TypeScript types
npm run db:validate  # Validate database schema and connections
npm run validate-env # Validate environment variables
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
│   │   │   ├── companies/     # Company management
│   │   │   ├── emails/        # Email management
│   │   │   ├── pipeline/      # Deal pipeline (Kanban view)
│   │   │   ├── settings/      # User settings
│   │   │   └── page.tsx       # Dashboard home
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Auth endpoints (2FA, sessions)
│   │   │   ├── admin/         # Admin endpoints (audit logs)
│   │   │   └── gdpr/          # GDPR compliance endpoints
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
│   │   ├── queries/           # React Query hooks (6+ query files)
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── security/          # Security utilities (2FA, audit, GDPR, etc.)
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
│   ├── audit-logs-schema.sql  # Audit logging system
│   ├── gdpr-compliance-schema.sql # GDPR compliance tables
│   ├── add-2fa-fields.sql     # Two-factor authentication setup
│   └── seed.sql               # Seed data for testing
├── scripts/                   # Utility scripts
│   ├── generate-types.js      # Generate Supabase types
│   ├── validate-database.js   # Database validation
│   └── validate-env.js        # Environment validation
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

**Core CRM Tables**:
- **user_profiles** - Extended user data beyond Supabase auth (first_name, last_name, avatar_url, role, 2FA settings)
- **clients** - Customer/prospect information (company_name, contact_name, email, phone, status, industry)
- **companies** - Separate company entities for better data normalization
- **deals** - Sales opportunities (title, value, stage, probability, priority, expected_close_date)
- **activities** - Tracks emails, calls, meetings, tasks, notes (linked to clients/deals)
- **meetings** - Calendar events with Google Calendar integration
- **emails** - Gmail sync and email management
- **automations** - n8n workflow configurations

**Security & Compliance Tables**:
- **audit_logs** - Comprehensive audit trail (actions, outcomes, risk levels, IP tracking)
- **user_sessions** - Session management and tracking
- **gdpr_requests** - Data export/deletion requests
- **two_factor_backup_codes** - 2FA backup codes

**Key Relationships**:
- `user_profiles` → `clients` → `deals` → `activities`
- `companies` ↔ `clients` (many-to-many via client company associations)
- `user_profiles` → `meetings`, `emails`, `automations`
- `user_profiles` → `audit_logs`, `user_sessions`

**Security Features**:
- Row Level Security (RLS) policies on all tables for data isolation
- Comprehensive audit logging for all actions
- Two-factor authentication support
- GDPR compliance with data export/deletion capabilities
- Session management with automatic cleanup
- Password strength validation and rate limiting
- CSRF protection on sensitive operations

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
- `companies.ts` - Company management
- `deals.ts` - Deal/pipeline operations
- `activities.ts` - Activity tracking
- `dashboard.ts` - Dashboard metrics
- `meetings.ts` - Calendar/meeting operations
- `auth.ts` - Authentication and session management

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
- `AddClientModal.tsx`, `AddDealModal.tsx`, `AddCompanyModal.tsx` - Creation modals
- `EditClientModal.tsx`, `EditDealModal.tsx`, `EditCompanyModal.tsx` - Edit modals
- `ClientRow.tsx`, `CompanyRow.tsx` - List item components
- `ActivityItem.tsx`, `AddActivityModal.tsx` - Activity management
- `ComposeEmailModal.tsx` - Email composition
- `ScheduleMeetingModal.tsx` - Meeting scheduling
- `QuickActions.tsx`, `SearchBar.tsx`, `UpcomingMeetings.tsx` - Utility components
- `ai-email-composer.tsx` - AI-powered email generation (Google Gemini)
- `deal-drawer.tsx` - Deal detail drawer
- `deal-risk-analysis.tsx` - AI deal risk assessment

**Security Components** (`src/components/ui/`):
- `TwoFactorAuth.tsx` - 2FA setup and verification
- `SessionManager.tsx` - Active session management
- `AuditLogViewer.tsx` - Audit trail display
- `PasswordStrengthIndicator.tsx` - Password validation UI
- `DeleteConfirmDialog.tsx` - Secure deletion confirmations

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
   - `database/setup.sql` - User profiles and base tables
   - `database/crm-schema.sql` - Core CRM schema (clients, deals, activities, etc.)
   - `database/companyTable.sql` - Company entities
   - `database/audit-logs-schema.sql` - Security audit logging
   - `database/gdpr-compliance-schema.sql` - GDPR compliance tables
   - `database/add-2fa-fields.sql` - Two-factor authentication
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

## Security Architecture

The application implements enterprise-grade security features:

### Authentication & Authorization
- **Multi-factor Authentication (2FA)** - TOTP-based with backup codes
- **Session Management** - Secure session tracking with automatic cleanup
- **Password Security** - Strength validation, secure hashing, breach detection
- **Rate Limiting** - Protection against brute force attacks

### Audit & Compliance
- **Comprehensive Audit Logging** - All user actions tracked with risk assessment
- **GDPR Compliance** - Data export, deletion, and consent management
- **Role-based Access Control** - Admin/user roles with appropriate permissions
- **Data Encryption** - At-rest and in-transit encryption

### Security Services (`src/lib/security/`):
- `audit-logger.ts` - Centralized audit logging with risk levels
- `two-factor-auth.ts` - 2FA implementation with backup codes
- `session-manager.ts` - Secure session handling
- `password-validation.ts` - Password strength and breach checking
- `rate-limiter.ts` - Request rate limiting
- `csrf-protection.ts` - Cross-site request forgery protection
- `gdpr-compliance.ts` - GDPR data management utilities

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

## Testing Framework

The application uses a comprehensive testing strategy following the testing pyramid:

### Testing Stack
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities  
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing

### Test Structure
```
src/__tests__/
├── __mocks__/           # Mock implementations
│   └── supabase.ts      # Supabase client mocks
├── components/          # Component integration tests
│   └── crm/            # CRM component tests
├── hooks/              # Custom hook tests
├── queries/            # TanStack Query hook tests
├── schemas/            # Zod validation tests
├── utils/              # Utility function tests
└── test-utils.tsx      # Common testing utilities
```

### Testing Patterns

**Unit Testing (Low-level)**:
- Utility functions (`src/lib/utils/`)
- Validation schemas (`src/lib/schemas/`)
- Security utilities (`src/lib/security/`)
- Custom hooks (`src/hooks/`)

**Integration Testing (Component-level)**:
- CRM components with mocked dependencies
- User interaction flows
- Form validation and submission
- Error handling and loading states

**Query Testing**:
- TanStack Query hooks with mocked Supabase
- Cache invalidation
- Optimistic updates
- Error scenarios

### Mock Strategy
- **Supabase Client**: Comprehensive mocks for database operations
- **Authentication**: Mock auth state and user management
- **External APIs**: Mock Google Gemini AI and other services
- **Next.js**: Mock router, image, and navigation components

### Test Utilities
- **Custom render**: Pre-configured with QueryClient and theme providers
- **Mock data**: Reusable mock objects for users, clients, deals, etc.
- **Auth helpers**: Functions to set up authenticated/unauthenticated states
- **Database helpers**: Functions to mock successful/failed database operations

### Coverage Targets
- Lines: 70%
- Functions: 70% 
- Branches: 70%
- Statements: 70%

### Running Tests
- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:ci` - CI-optimized test run

## Migration Context

This project evolved from a simple auth template into a full-featured CRM application (SalesFlow). The codebase maintains the original authentication foundation while adding comprehensive CRM functionality including client management, deal tracking, activity monitoring, and enterprise security features. The application is production-ready with GDPR compliance, audit logging, multi-factor authentication, and comprehensive test coverage.

## Environment Variables

Required environment variables for development and production:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Features (Optional)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Security (Optional - auto-generated if not provided)
NEXTAUTH_SECRET=your-nextauth-secret
CSRF_SECRET=your-csrf-secret

# Production Only
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```