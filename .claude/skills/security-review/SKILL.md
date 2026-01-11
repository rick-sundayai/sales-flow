---
name: security-review
description: Review code for security vulnerabilities, authentication issues, data exposure, and common security pitfalls. Use when reviewing security-sensitive code, authentication flows, API routes, or when the user mentions security, vulnerabilities, authentication, authorization, or data protection.
allowed-tools: Read, Grep, Glob
user-invocable: true
---

# Security Review Skill

Performs comprehensive security review of the SalesFlow CRM application code.

## Instructions

When reviewing code for security issues, focus on these critical areas:

### 1. Authentication & Authorization

#### Verify Protected Routes

```typescript
// ✅ Correct - middleware protects routes
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

// ❌ Wrong - no route protection
export default function DashboardPage() {
  // Anyone can access this
  return <Dashboard />
}
```

#### Check Row Level Security (RLS)

```sql
-- ✅ Correct - RLS enabled on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own clients"
ON clients FOR ALL
USING (auth.uid() = user_id);

-- ❌ Wrong - no RLS policy
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  data JSONB
);
-- Anyone can access all data!
```

#### Verify Session Management

```typescript
// ✅ Correct - proper session validation
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  redirect('/auth/login')
}

// ❌ Wrong - trusting client-side session
const user = localStorage.getItem('user')
if (user) {
  // Trusting unverified data
}
```

### 2. Input Validation

#### SQL Injection Prevention

```typescript
// ✅ Correct - parameterized queries via Supabase
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('email', userInput)  // Supabase handles sanitization

// ❌ Wrong - raw SQL with user input
const query = `SELECT * FROM clients WHERE email = '${userInput}'`
// Vulnerable to SQL injection!
```

#### XSS Prevention

```typescript
// ✅ Correct - React escapes by default
<div>{userInput}</div>

// ✅ Correct - using DOMPurify for HTML
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />

// ❌ Wrong - unescaped HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// Vulnerable to XSS!
```

#### Form Validation

```typescript
// ✅ Correct - server-side validation
import { z } from 'zod'

const clientSchema = z.object({
  email: z.string().email(),
  company_name: z.string().min(1).max(100),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/).optional(),
})

// Validate on server
export async function POST(request: Request) {
  const body = await request.json()
  const result = clientSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Process validated data
}

// ❌ Wrong - only client-side validation
// Trust nothing from the client!
```

### 3. Sensitive Data Protection

#### Environment Variables

```typescript
// ✅ Correct - server-only secrets
// .env.local (never committed)
SUPABASE_SERVICE_ROLE_KEY=secret_key  // Server-side only

// .env.local (for client exposure)
NEXT_PUBLIC_SUPABASE_URL=https://...  // OK to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     // OK to expose (anon key)

// ❌ Wrong - exposing secrets to client
NEXT_PUBLIC_SECRET_KEY=secret  // Don't prefix secrets with NEXT_PUBLIC_!
```

#### API Keys and Secrets

```typescript
// ✅ Correct - secrets in environment
const apiKey = process.env.GEMINI_API_KEY

// ✅ Correct - using in API routes only
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  // Use apiKey server-side
}

// ❌ Wrong - hardcoded secrets
const apiKey = 'sk-abc123...'  // Never hardcode!

// ❌ Wrong - exposing in client components
'use client'
const apiKey = process.env.GEMINI_API_KEY  // Don't use secrets in client!
```

#### Logging Sensitive Data

```typescript
// ✅ Correct - sanitized logging
console.log('User login attempt:', { email: user.email })

// ❌ Wrong - logging passwords
console.log('Login:', { email, password })  // Never log passwords!

// ❌ Wrong - logging tokens
console.log('Auth token:', token)  // Don't log tokens!
```

### 4. API Security

#### Rate Limiting

```typescript
// ✅ Correct - implement rate limiting
import { rateLimit } from '@/lib/security/rate-limiter'

export async function POST(request: Request) {
  const identifier = request.headers.get('x-forwarded-for') || 'unknown'

  const { success } = await rateLimit(identifier, {
    limit: 10,
    window: 60000, // 1 minute
  })

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process request
}

// ❌ Wrong - no rate limiting
export async function POST(request: Request) {
  // Anyone can spam this endpoint
}
```

#### CORS Configuration

```typescript
// ✅ Correct - restrictive CORS
export async function OPTIONS(request: Request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://yourdomain.com',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// ❌ Wrong - wildcard CORS
headers: {
  'Access-Control-Allow-Origin': '*',  // Too permissive!
}
```

#### CSRF Protection

```typescript
// ✅ Correct - CSRF token validation
import { validateCSRFToken } from '@/lib/security/csrf-protection'

export async function POST(request: Request) {
  const csrfToken = request.headers.get('x-csrf-token')

  if (!validateCSRFToken(csrfToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  // Process request
}

// ❌ Wrong - no CSRF protection on state-changing operations
export async function POST(request: Request) {
  // Vulnerable to CSRF attacks
  await deleteUser(userId)
}
```

### 5. Error Handling

#### Safe Error Messages

```typescript
// ✅ Correct - generic error messages to users
catch (error) {
  console.error('Database error:', error)  // Log detailed error
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },  // Generic to user
    { status: 500 }
  )
}

// ❌ Wrong - exposing internal errors
catch (error) {
  return NextResponse.json(
    { error: error.message },  // Might expose sensitive info!
    { status: 500 }
  )
}
```

#### Error Information Leakage

```typescript
// ✅ Correct - sanitized stack traces
if (process.env.NODE_ENV === 'development') {
  console.error(error.stack)
}
// Don't send stack traces to client

// ❌ Wrong - exposing stack traces
return NextResponse.json({
  error: error.message,
  stack: error.stack,  // Exposes internal structure!
})
```

### 6. Dependency Security

#### Check for Vulnerabilities

```bash
# ✅ Regularly run security audits
npm audit
npm audit fix

# Check for outdated packages
npm outdated
```

#### Verify Dependencies

```typescript
// ✅ Correct - using trusted packages
import { z } from 'zod'  // Well-known, maintained package

// ⚠️ Caution - unknown packages
import { sketchy } from 'random-unknown-package'  // Verify before using!
```

### 7. File Upload Security

```typescript
// ✅ Correct - validate file types and size
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  // Generate safe filename
  const safeFilename = `${crypto.randomUUID()}.${file.name.split('.').pop()}`

  // Upload to secure storage
}

// ❌ Wrong - accepting any file
export async function POST(request: Request) {
  const file = formData.get('file')
  // No validation - vulnerable!
}
```

### 8. Authentication Best Practices

#### Password Requirements

```typescript
// ✅ Correct - strong password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')

// ❌ Wrong - weak password requirements
const passwordSchema = z.string().min(4)  // Too weak!
```

#### Multi-Factor Authentication

```typescript
// ✅ Verify 2FA is enabled for sensitive operations
if (!user.two_factor_enabled) {
  return NextResponse.json(
    { error: 'Please enable 2FA for this operation' },
    { status: 403 }
  )
}

// Verify TOTP code
const isValid = await verifyTOTP(user.id, totpCode)
if (!isValid) {
  return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
}
```

### 9. Database Security

#### Parameterized Queries Only

```typescript
// ✅ Correct - always use Supabase query builder
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('id', clientId)
  .single()

// ❌ Wrong - never use raw SQL with user input
const { data } = await supabase.rpc('unsafe_query', {
  sql: `SELECT * FROM clients WHERE id = '${clientId}'`
})
```

#### Audit Logging

```typescript
// ✅ Correct - log security-relevant actions
import { logAuditEvent } from '@/lib/security/audit-logger'

export async function DELETE(request: Request) {
  const userId = await getCurrentUserId()

  await logAuditEvent({
    user_id: userId,
    action: 'client.delete',
    resource_type: 'client',
    resource_id: clientId,
    ip_address: request.headers.get('x-forwarded-for'),
    risk_level: 'high',
  })

  // Perform deletion
}
```

### 10. Common Vulnerabilities Checklist

When reviewing code, check for:

- [ ] **SQL Injection** - All queries use parameterized statements
- [ ] **XSS** - User input is properly escaped or sanitized
- [ ] **CSRF** - State-changing operations have CSRF protection
- [ ] **Authentication** - Protected routes verify user session
- [ ] **Authorization** - Users can only access their own data (RLS)
- [ ] **Secrets** - No hardcoded API keys, passwords, tokens
- [ ] **Environment Variables** - Secrets not exposed to client
- [ ] **Error Messages** - Don't leak sensitive information
- [ ] **Rate Limiting** - API endpoints have rate limits
- [ ] **Input Validation** - All user input validated server-side
- [ ] **File Uploads** - File type and size restrictions
- [ ] **Password Security** - Strong password requirements
- [ ] **Session Management** - Secure session handling
- [ ] **Audit Logging** - Security events are logged
- [ ] **Dependencies** - No known vulnerabilities in packages

## Critical Security Patterns for This Project

### Supabase RLS Policies

Every table should have RLS enabled:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All should have rowsecurity = true
```

### API Route Protection

All API routes should verify authentication:

```typescript
// Pattern for protected API routes
export async function POST(request: Request) {
  // 1. Verify authentication
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate CSRF token for state-changing operations
  const csrfToken = request.headers.get('x-csrf-token')
  if (!validateCSRFToken(csrfToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  // 3. Validate input
  const body = await request.json()
  const result = schema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // 4. Perform operation with user context
  // RLS ensures user can only access their data
}
```

## Security Review Process

When performing a security review:

1. **Start with authentication flows** - Login, registration, password reset
2. **Check route protection** - Middleware, API routes, server components
3. **Review RLS policies** - Database-level security
4. **Audit API endpoints** - Input validation, rate limiting, CSRF
5. **Check for secrets exposure** - Environment variables, hardcoded keys
6. **Verify error handling** - No information leakage
7. **Test file uploads** - Type validation, size limits
8. **Review audit logging** - Security events are tracked
9. **Check dependencies** - Run `npm audit`

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security: https://supabase.com/docs/guides/auth/row-level-security
- Next.js Security: https://nextjs.org/docs/app/building-your-application/authentication
- Web Security Academy: https://portswigger.net/web-security

## When to Apply This Skill

Use this Skill when:
- Reviewing pull requests with security-sensitive changes
- Implementing authentication or authorization
- Creating new API routes
- Handling user input or file uploads
- Working with sensitive data
- Debugging security vulnerabilities
- Conducting periodic security audits
