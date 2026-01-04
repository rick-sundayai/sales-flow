# Next.js + Supabase Authentication Template

A clean, production-ready authentication template built with **Next.js 15**, **Supabase**, and **TypeScript**. This template provides a complete authentication system with user management, route protection, and a beautiful dark-themed UI.

## ✨ Features

- 🔐 **Complete Authentication System** - Login, Register, Password Reset
- 🛡️ **Route Protection** - Middleware-based authentication
- 👤 **User Profiles** - Automatic profile creation and management
- 🎨 **Modern UI** - Dark theme with Tailwind CSS
- 🔒 **Security First** - Row Level Security (RLS) policies
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Next.js 15** - Latest features with App Router
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
3. Copy and paste the contents of `database/setup.sql`
4. Click **Run** to execute the script

### 4. Start Development

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   └── reset-password/ # Password reset
│   ├── dashboard/         # Protected dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── auth/             # Authentication forms
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
│   └── useAuth.tsx       # Authentication hook
├── lib/                  # Utilities and services
│   ├── auth/             # Auth service
│   ├── supabase/         # Supabase clients
│   └── types/            # TypeScript types
└── middleware.ts         # Route protection
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

The template uses a simple but effective schema:

### `user_profiles` table
- `id` - Primary key (UUID)
- `user_id` - Foreign key to `auth.users`
- `email` - User's email address
- `first_name` - User's first name
- `last_name` - User's last name
- `full_name` - Generated full name
- `avatar_url` - Profile picture URL (optional)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Security Features
- **Row Level Security (RLS)** - Users can only access their own data
- **Automatic Profile Creation** - Triggered on user signup
- **Type Safety** - Full TypeScript integration

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
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

### Adding New Pages
1. Create page in `src/app/your-page/page.tsx`
2. Add route protection in `src/middleware.ts` if needed
3. Import and use `useAuth` hook for user data

### Extending User Profiles
1. Update database schema in `database/setup.sql`
2. Update TypeScript types in `src/lib/types/auth.ts`
3. Modify the profile creation trigger function

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub/GitLab
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this template for any project!

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) section
2. Ensure your Supabase setup is correct
3. Verify environment variables are set
4. Check browser console for errors

---

**Happy coding!** 🚀