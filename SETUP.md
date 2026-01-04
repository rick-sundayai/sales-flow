# Setup Guide - Step by Step

This guide will walk you through setting up the Next.js + Supabase Authentication Template from scratch.

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 18 or higher** installed on your computer
- ✅ **npm** or **yarn** package manager
- ✅ A **Supabase account** (free tier available)
- ✅ A code editor (VS Code recommended)

## 🔧 Step 1: Project Setup

### Navigate to Project Directory
```bash
cd talent-aether-auth-template
```

### Install Dependencies
```bash
# Using npm
npm install

# Or using yarn
yarn install
```

This will install all necessary packages including Next.js, Supabase, TypeScript, and Tailwind CSS.

## ☁️ Step 2: Supabase Setup

### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** 
3. Sign in with GitHub (recommended) or email
4. Click **"New project"**
5. Choose your organization
6. Fill in project details:
   - **Name**: `your-app-auth` (or any name you prefer)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (for development)
7. Click **"Create new project"**

⏳ **Wait 2-3 minutes** for your project to be ready.

### Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. You'll see:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJhbGci`)

Keep these handy for the next step!

## 🔐 Step 3: Environment Configuration

### Create Environment File

```bash
# Copy the template
cp .env.example .env.local
```

### Add Your Supabase Credentials

Open `.env.local` in your code editor and replace the placeholder values:

```env
# Replace with your actual Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Replace with your actual anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep these as is for development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

⚠️ **Important**: Never commit `.env.local` to version control!

## 🗄️ Step 4: Database Setup

### Run the Setup Script

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Open the file `database/setup.sql` from your project
5. **Copy all the content** from that file
6. **Paste it** into the Supabase SQL Editor
7. Click the **"RUN"** button

You should see a success message like:
```
🎉 SUPABASE AUTH SETUP COMPLETE!
✅ User profiles table created
✅ Row Level Security enabled
✅ Automatic profile creation configured
✅ Performance indexes added
```

### Verify Database Setup

1. In Supabase, go to **Table Editor**
2. You should see a new table called `user_profiles`
3. Click on it to see the structure

## 🚀 Step 5: Start Development

### Run the Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.5.0
  - Local:        http://localhost:3000
  - Ready in 1.2s
```

### Test Your Setup

1. Open your browser to `http://localhost:3000`
2. You should see the welcome page
3. Click **"Create Account"** to test registration
4. Try creating a test user:
   - **First Name**: Test
   - **Last Name**: User  
   - **Email**: test@example.com
   - **Password**: password123

### Check Email Confirmation

Since you're in development mode, Supabase will show confirmation links in the **Auth** > **Users** section of your dashboard instead of sending real emails.

## ✅ Step 6: Verification Checklist

Make sure everything is working:

- [ ] Home page loads at `http://localhost:3000`
- [ ] You can navigate to login and register pages
- [ ] Registration creates a new user (check Supabase Auth > Users)
- [ ] User profile is automatically created (check Table Editor > user_profiles)
- [ ] Login works with your test user
- [ ] Dashboard loads after successful login
- [ ] Sign out works and redirects to home page

## 🔧 Troubleshooting

### Common Issues

#### "Invalid API key" Error
- ✅ Double-check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Make sure there are no extra spaces or quotes
- ✅ Restart the dev server after changing environment variables

#### "table user_profiles does not exist"
- ✅ Make sure you ran the database setup SQL script completely
- ✅ Check the Supabase SQL Editor for any error messages
- ✅ Verify the table exists in Table Editor

#### Registration Not Working
- ✅ Check browser console for errors (F12)
- ✅ Make sure your Supabase project is active (not paused)
- ✅ Verify the database trigger was created properly

#### Redirects Not Working
- ✅ Clear your browser cache and cookies
- ✅ Try an incognito/private window
- ✅ Check that middleware.ts is in the src folder

### Getting Help

If you're still having issues:

1. **Check the browser console** (F12 → Console tab) for error messages
2. **Check your terminal** where `npm run dev` is running for server errors
3. **Verify your Supabase dashboard** for any service issues
4. **Review the setup steps** to make sure you didn't miss anything

### Development Tips

- Use **Chrome DevTools** to inspect network requests
- Check **Supabase Dashboard** > **Auth** > **Users** to see registered users
- Use **Table Editor** to view user profiles
- Monitor **Logs** in Supabase for database errors

## 🎉 Success!

If everything is working, you now have a fully functional authentication system! You can:

- 📝 Customize the styling in `src/app/globals.css`
- 🔧 Add new pages in the `src/app` directory
- 🛠️ Modify components in `src/components`
- 📊 Extend the user profile schema
- 🚀 Deploy to Vercel or your preferred hosting platform

**Happy coding!** 🚀