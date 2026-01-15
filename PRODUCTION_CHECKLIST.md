# Production Deployment Checklist

Use this checklist when deploying SalesFlow CRM to production.

## Pre-Deployment

### 1. Environment Variables

Configure the following in Vercel Dashboard > Settings > Environment Variables:

**Required:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL (e.g., `https://yourdomain.com`)

**Recommended for Production:**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - For server-side admin operations
- [ ] `GEMINI_API_KEY` - For AI features (email composer, deal analysis)
- [ ] `UPSTASH_REDIS_REST_URL` - For distributed rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Upstash authentication

**Optional Integrations:**
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- [ ] `NEXT_PUBLIC_GA_ID` - Google Analytics
- [ ] `SECURITY_WEBHOOK_URL` - Slack/Discord alerts for security events
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email sending

### 2. Database Setup

Run these SQL scripts in Supabase SQL Editor (in order):

1. [ ] `database/setup.sql` - User profiles and base tables
2. [ ] `database/crm-schema.sql` - Core CRM schema
3. [ ] `database/companyTable.sql` - Company entities
4. [ ] `database/audit-logs-schema.sql` - Audit logging
5. [ ] `database/gdpr-compliance-schema.sql` - GDPR compliance
6. [ ] `database/add-2fa-fields.sql` - Two-factor authentication

### 3. Supabase Configuration

- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Configure authentication providers (email enabled)
- [ ] Set up email templates for auth emails
- [ ] Configure redirect URLs for authentication

### 4. DNS Configuration

- [ ] Point domain to Vercel
- [ ] Configure SSL certificate (automatic with Vercel)
- [ ] Set up www redirect if needed

---

## Deployment

### 5. Vercel Deployment

```bash
# Option A: Via GitHub (recommended)
# 1. Push to main branch
# 2. Vercel auto-deploys

# Option B: Manual
vercel --prod
```

- [ ] Connect repository to Vercel
- [ ] Set environment variables in Vercel
- [ ] Trigger production deployment
- [ ] Verify deployment succeeded

---

## Post-Deployment Verification

### 6. Health Checks

```bash
# Verify health endpoint
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0","environment":"production"}
```

- [ ] Health endpoint returns 200
- [ ] All health checks pass

### 7. Functional Testing

- [ ] Landing page loads correctly
- [ ] Login flow works
- [ ] Registration works (if not invite-only)
- [ ] Dashboard loads for authenticated users
- [ ] Client CRUD operations work
- [ ] Deal pipeline displays correctly
- [ ] Activity logging works

### 8. Security Verification

- [ ] HTTPS redirect works
- [ ] Security headers present (check via browser dev tools)
- [ ] Authentication required for /dashboard routes
- [ ] Rate limiting active (test with repeated requests)

---

## Monitoring Setup (Recommended)

### 9. Error Tracking

If using Sentry:
- [ ] Verify errors are being captured
- [ ] Set up alert rules for critical errors

### 10. Uptime Monitoring

Set up external monitoring:
- [ ] Configure uptime check for `/api/health`
- [ ] Set up alerts for downtime
- [ ] Recommended: UptimeRobot, Pingdom, or similar

---

## Rollback Procedure

If issues are discovered after deployment:

1. **Via Vercel Dashboard:**
   - Go to Deployments tab
   - Find previous stable deployment
   - Click "..." menu > "Promote to Production"

2. **Via CLI:**
   ```bash
   vercel rollback
   ```

---

## Post-Launch Improvements

These items should be addressed after initial production deployment:

### Code Quality (High Priority)
- [ ] Fix TypeScript type inconsistencies (company types, activity types)
- [ ] Enable `ignoreBuildErrors: false` in `next.config.ts`
- [ ] Fix ESLint warnings and enable `ignoreDuringBuilds: false`
- [ ] Run `npm run type-check` and resolve all errors

### Security Hardening
- [ ] Set up Upstash Redis for distributed rate limiting
- [ ] Configure Sentry for error tracking
- [ ] Implement QR code generation for 2FA setup
- [ ] Add pre-commit hooks with Husky

### Testing
- [ ] Increase test coverage to 80%+
- [ ] Add E2E tests with Playwright
- [ ] Add integration tests for critical flows

---

## Security Notes

- Never commit `.env.local` or production secrets to git
- Rotate API keys periodically
- Monitor audit logs for suspicious activity
- Keep dependencies updated (`npm audit`)

---

## Support

For issues:
- Check Vercel deployment logs
- Review Supabase logs
- Check browser console for client errors
- Review `/api/health` endpoint response
