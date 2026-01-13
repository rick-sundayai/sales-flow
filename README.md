# SalesFlow CRM  🚀

A production-ready, full-featured CRM application built with **Next.js 15**, **Supabase**, and **TypeScript**. SalesFlow provides comprehensive client relationship management, deal pipeline tracking, activity monitoring, and enterprise-grade security features with a beautiful dark-themed UI.

## ✨ Features

### Core CRM Capabilities
- 👥 **Client Management** - Track clients and prospects with detailed contact information
- 🏢 **Company Management** - Separate company entities for better organization
- 💼 **Deal Pipeline** - Visual Kanban board for sales opportunity tracking
- 📊 **Activity Tracking** - Log emails, calls, meetings, tasks, and notes
- 📧 **Email Management** - Compose and track email communications
- 📅 **Calendar Integration** - Schedule and manage meetings
- 🤖 **AI-Powered Features** - Email composition and deal risk analysis (Google Gemini)
- 📈 **Dashboard Analytics** - Real-time metrics and KPIs

### Security & Compliance
- 🔐 **Multi-Factor Authentication (2FA)** - TOTP-based with backup codes
- 🛡️ **Comprehensive Audit Logging** - Track all user actions with risk assessment
- 🔒 **GDPR Compliance** - Data export and deletion capabilities
- 👤 **Session Management** - Secure session tracking with automatic cleanup
- 🔑 **Row Level Security (RLS)** - Database-level data isolation
- 🚨 **Rate Limiting** - Protection against brute force attacks

### Developer Experience
- ⚡ **Next.js 15** - Latest features with App Router and Turbopack
- 🎨 **Modern UI** - shadcn/ui components (50+) with dark theme
- 📱 **Responsive Design** - Mobile-first approach
- 🔧 **Type Safety** - Strict TypeScript throughout
- 🧪 **Comprehensive Testing** - Jest + React Testing Library
- 🚀 **Production Ready** - Optimized build configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([create one here](https://supabase.com))

### 1. Clone & Install

```bash
# Navigate to the project directory
cd talent-aether-auth-template

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit the file and add your Supabase credentials
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Run the SQL scripts in this order:
   - `database/setup.sql` - User profiles and base tables
   - `database/crm-schema.sql` - Core CRM schema (clients, deals, activities)
   - `database/companyTable.sql` - Company entities
   - `database/audit-logs-schema.sql` - Security audit logging
   - `database/gdpr-compliance-schema.sql` - GDPR compliance tables
   - `database/add-2fa-fields.sql` - Two-factor authentication
   - `database/seed.sql` - (Optional) Sample data for testing

### 4. Start Development

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── auth/              # Authentication pages (login, register, reset)
│   ├── dashboard/         # Protected CRM area
│   │   ├── activities/    # Activity tracking page
│   │   ├── calendar/      # Calendar/meetings view
│   │   ├── clients/       # Client management
│   │   ├── companies/     # Company management
│   │   ├── emails/        # Email management
│   │   ├── pipeline/      # Deal pipeline (Kanban view)
│   │   ├── reports/       # Analytics and reporting
│   │   ├── settings/      # User settings & 2FA
│   │   └── page.tsx       # Dashboard home
│   ├── api/               # API routes
│   │   ├── auth/          # Auth endpoints (2FA, sessions)
│   │   ├── admin/         # Admin endpoints (audit logs)
│   │   └── gdpr/          # GDPR compliance endpoints
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Public homepage
├── components/
│   ├── auth/              # Auth forms (Login, Register)
│   ├── crm/               # 15+ CRM-specific components
│   │   ├── AddClientModal.tsx, EditClientModal.tsx
│   │   ├── AddDealModal.tsx, EditDealModal.tsx
│   │   ├── AddCompanyModal.tsx, EditCompanyModal.tsx
│   │   ├── AddActivityModal.tsx, ActivityItem.tsx
│   │   ├── DealCard.tsx, PipelineColumn.tsx
│   │   ├── ComposeEmailModal.tsx
│   │   ├── ScheduleMeetingModal.tsx
│   │   ├── ai-email-composer.tsx
│   │   ├── deal-risk-analysis.tsx
│   │   └── MetricCard.tsx, QuickActions.tsx
│   ├── dashboard/         # Dashboard layout components
│   ├── layout/            # App shell (Navbar, Sidebar)
│   └── ui/                # 50+ shadcn/ui components
├── hooks/                 # Custom React hooks
│   ├── useAuth.tsx        # Authentication hook
│   └── useMounted.tsx     # Hydration hook
├── lib/
│   ├── auth/              # Authentication service
│   ├── providers/         # React Query provider
│   ├── queries/           # TanStack Query hooks
│   │   ├── clients.ts     # Client CRUD
│   │   ├── companies.ts   # Company management
│   │   ├── deals.ts       # Deal pipeline
│   │   ├── activities.ts  # Activity tracking
│   │   ├── meetings.ts    # Calendar operations
│   │   └── dashboard.ts   # Dashboard metrics
│   ├── schemas/           # Zod validation schemas
│   ├── security/          # Security utilities
│   │   ├── audit-logger.ts
│   │   ├── two-factor-auth.ts
│   │   ├── session-manager.ts
│   │   ├── password-validation.ts
│   │   └── gdpr-compliance.ts
│   ├── services/          # Business logic and API calls
│   ├── supabase/          # Supabase client configuration
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
└── middleware.ts          # Route protection and auth redirects
```

## 🔒 Authentication Flow

### User Registration
1. User fills registration form
2. Supabase creates auth user
3. Database trigger creates user profile
4. Email confirmation sent
5. User redirected to check email page

### User Login
1. User enters credentials
2. Supabase validates login
3. User profile retrieved
4. Redirected to dashboard

### Route Protection
- Middleware automatically protects routes
- Unauthenticated users → Login page
- Authenticated users on auth pages → Dashboard

## 🗄️ Database Schema

SalesFlow uses a comprehensive CRM schema with multiple interconnected tables:

### Core CRM Tables
- **`user_profiles`** - Extended user data (name, avatar, role, 2FA settings)
- **`clients`** - Customer/prospect information (contact details, status, industry)
- **`companies`** - Separate company entities for better data normalization
- **`deals`** - Sales opportunities (value, stage, probability, expected close date)
- **`activities`** - Emails, calls, meetings, tasks, notes (linked to clients/deals)
- **`meetings`** - Calendar events with Google Calendar integration
- **`emails`** - Email tracking and management

### Security & Compliance Tables
- **`audit_logs`** - Comprehensive audit trail with risk assessment
- **`user_sessions`** - Session management and tracking
- **`gdpr_requests`** - Data export/deletion requests
- **`two_factor_backup_codes`** - 2FA backup codes

### Key Relationships
```
user_profiles → clients → deals → activities
              → companies
              → meetings, emails
              → audit_logs, user_sessions
```

### Security Features
- **Row Level Security (RLS)** - Database-level data isolation per user
- **Comprehensive Audit Logging** - All actions tracked with risk levels
- **Two-Factor Authentication** - TOTP-based with backup codes
- **GDPR Compliance** - Built-in data export and deletion capabilities
- **Session Management** - Secure session tracking with automatic cleanup
- **Automated Triggers** - Auto-timestamps, stage tracking, contact updates

## 🛠️ Available Scripts

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

## 🤖 AI Features

SalesFlow includes powerful AI capabilities powered by Google Gemini:

### AI Email Composer
- **Context-Aware Generation** - Automatically includes client and deal context
- **Tone Selection** - Choose between professional, casual, and persuasive tones
- **Deal-Specific Context** - Injects relevant deal information for personalized emails

### Deal Risk Analysis
- **Probability Assessment** - Analyzes deal health and likelihood of closing
- **Risk Factor Identification** - Highlights potential issues and concerns
- **Actionable Recommendations** - Provides specific steps to improve deal outcomes

To enable AI features, add your Gemini API key to `.env.local`:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

## 🎨 Customization

### Styling
The template uses Tailwind CSS with a custom color scheme defined in `tailwind.config.ts`:

```typescript
colors: {
  background: "#191D24",  // Dark background
  surface: "#2D3748",     // Card/surface color
  primary: "#34D399",     // Mint green accent
  border: "#4A5568",      // Border color
  text: "#F5F5F5",        // Text color
}
```

### Adding New CRM Features
1. Create database tables in a new migration file
2. Generate TypeScript types: `npm run db:generate-types`
3. Create React Query hooks in `src/lib/queries/`
4. Build UI components in `src/components/crm/`
5. Add pages in `src/app/dashboard/`

### Extending User Profiles
1. Update database schema in `database/setup.sql`
2. Generate new types: `npm run db:generate-types`
3. Update forms and components as needed

### Customizing Security
- Configure 2FA settings in user settings page
- Adjust audit log retention in `src/lib/security/audit-logger.ts`
- Modify rate limits in `src/lib/security/rate-limiter.ts`
- Update GDPR workflows in `src/lib/security/gdpr-compliance.ts`

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub/GitLab
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables for Production
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional - AI Features
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Security (auto-generated if not provided)
NEXTAUTH_SECRET=your-nextauth-secret
CSRF_SECRET=your-csrf-secret
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI Library**: React 19 with TypeScript (strict mode)
- **Component Library**: shadcn/ui (50+ components)
- **Styling**: TailwindCSS with custom design system
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: react-hook-form + Zod validation
- **AI Integration**: Google Gemini API

### Backend & Database
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with 2FA support
- **Real-time**: Supabase Realtime subscriptions
- **API**: Next.js API Routes (Route Handlers)
- **Security**: Row Level Security (RLS) policies

### Testing & Quality
- **Testing Framework**: Jest + React Testing Library
- **Type Checking**: TypeScript with strict mode
- **Linting**: ESLint with Next.js rules
- **Coverage**: 70%+ target across the board

### DevOps
- **Build Tool**: Turbopack (Next.js 15)
- **Deployment**: Vercel-optimized
- **Environment Management**: dotenv with validation

## 📚 Learn More

### Documentation
- [Next.js Documentation](https://nextjs.org/docs) - Next.js 15 features and App Router
- [Supabase Documentation](https://supabase.com/docs) - Database, Auth, and Realtime
- [TailwindCSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Re-usable component library
- [TanStack Query](https://tanstack.com/query/latest) - Powerful data synchronization
- [Google Gemini API](https://ai.google.dev/gemini-api/docs) - AI integration

### Project Documentation
- [CLAUDE.md](CLAUDE.md) - Comprehensive project architecture and patterns
- [.claude/README.md](.claude/README.md) - Claude Code skills for this project

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this template for any project!

## 🎯 Key Features Showcase

### Dashboard
- Real-time metrics and KPIs
- Quick actions for common tasks
- Upcoming meetings and activities
- Recent client interactions

### Client Management
- Comprehensive client profiles
- Status tracking (Lead, Prospect, Active, Inactive)
- Industry categorization
- Contact information management

### Deal Pipeline
- Visual Kanban board
- Drag-and-drop deal movement
- Stage-based organization (Lead, Qualified, Proposal, Negotiation, Closed)
- Deal value and probability tracking
- Priority indicators

### Activity Tracking
- Log all client interactions (emails, calls, meetings, tasks, notes)
- Timeline view of activities
- Filter by type and status
- Link activities to clients and deals

### Security & Compliance
- Two-factor authentication (2FA) with TOTP
- Comprehensive audit logging with risk assessment
- GDPR-compliant data export and deletion
- Session management and monitoring
- Rate limiting and brute force protection

## 🆘 Support & Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify Supabase URL and anon key in `.env.local`
- Check that RLS policies are enabled
- Ensure all migration scripts ran successfully

**Authentication Problems**
- Clear browser cookies and local storage
- Check Supabase Auth settings in dashboard
- Verify email confirmation settings

**Build Errors**
- Run `npm run type-check` to identify TypeScript issues
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`
- Ensure Node.js version is 18 or higher

**Testing Issues**
- Clear Jest cache: `npm run test -- --clearCache`
- Check mock implementations in `src/__tests__/__mocks__/`
- Verify test environment variables

### Getting Help

1. Check the [CLAUDE.md](CLAUDE.md) for architecture details
2. Review database schema files in `database/`
3. Examine existing components for patterns
4. Run `npm run validate-env` to check environment setup

## 📝 License

MIT License - feel free to use this for personal or commercial projects!

## 🙏 Acknowledgments

Built with modern web technologies and best practices:
- Next.js 15 App Router architecture
- Supabase for backend infrastructure
- shadcn/ui for beautiful components
- TanStack Query for data management
- Google Gemini for AI capabilities

---

**Ready to manage your sales pipeline like a pro!** 🚀