---
name: typescript-safety
description: Review TypeScript code for type safety, strict mode compliance, and proper type annotations. Use when writing TypeScript code, fixing type errors, refactoring components, or when the user mentions TypeScript, type safety, strict mode, or type checking.
allowed-tools: Read, Grep, Glob, Bash(npm run type-check)
---

# TypeScript Safety Checker

Ensures TypeScript code in the SalesFlow CRM follows strict type safety standards.

## Instructions

When reviewing or writing TypeScript code, verify:

### 1. Strict Mode Compliance

Check that code adheres to TypeScript strict mode settings:
- No `any` types without explicit justification and `// @ts-ignore` comment
- Proper null/undefined handling with `strictNullChecks`
- Explicit function return types for public APIs
- No implicit `any` on parameters

### 2. Supabase Type Safety

All database operations must use generated Supabase types:

```typescript
// ✅ Correct - using typed client
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

const supabase = createClient()
const { data, error } = await supabase
  .from('clients')
  .select('*')
// data is properly typed as Client[]

// ❌ Wrong - no type safety
const { data } = await supabase.from('clients').select('*')
// data is any
```

### 3. React Query Type Safety

Ensure TanStack Query hooks have proper typing:

```typescript
// ✅ Correct
export function useClients() {
  return useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')

      if (error) throw error
      return data
    },
  })
}

// ❌ Wrong - no generic types
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => { /* ... */ }
  })
}
```

### 4. Component Props

All React components must have explicit TypeScript interfaces:

```typescript
// ✅ Correct
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  // ...
}

// ❌ Wrong - no interface
export function MetricCard({ title, value, icon, trend }) {
  // ...
}
```

### 5. API Response Handling

Verify proper error handling and type guards for API calls:

```typescript
// ✅ Correct
async function fetchClient(id: string): Promise<Client> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch client: ${error.message}`)
  }

  if (!data) {
    throw new Error('Client not found')
  }

  return data
}

// ❌ Wrong - no null checking
async function fetchClient(id: string) {
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  return data // might be null!
}
```

### 6. Form Validation with Zod

Ensure forms use zod schemas with proper typing:

```typescript
// ✅ Correct
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

export function ClientForm() {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  })
  // ...
}
```

## Common Issues in This Project

### Database Types
- All Supabase queries should use types from `@/lib/types/database`
- Run `npm run db:generate-types` to update database types after schema changes
- Never use `as any` to bypass database type errors - fix the schema instead

### React Query Mutations
- `useMutation` hooks need proper `OnSuccess` and `OnError` type definitions
- Always invalidate related queries after mutations
- Use optimistic updates with proper type guards

### Server vs Client Components
- Server Components: Can't use hooks, return promises
- Client Components: Must have `'use client'` directive
- Props passed between server/client must be serializable

### Path Aliases
- Always use `@/*` imports, never relative paths like `../../`
- Example: `import { Button } from '@/components/ui/button'`

## Type Checking Workflow

1. **Before committing**, run:
   ```bash
   npm run type-check
   ```

2. **Fix errors from most specific to least**:
   - Fix explicit type errors first
   - Then fix implicit `any` warnings
   - Finally address strict mode warnings

3. **Use type assertions sparingly**:
   ```typescript
   // Only when you have more info than TypeScript
   const user = data as User

   // Better: use type guards
   if (isUser(data)) {
     // data is User here
   }
   ```

## Resources

- TypeScript strict mode: https://www.typescriptlang.org/tsconfig#strict
- Supabase TypeScript docs: https://supabase.com/docs/guides/api/typescript-support
- React Query TypeScript: https://tanstack.com/query/latest/docs/react/typescript
- Zod documentation: https://zod.dev/

## When to Apply This Skill

Use this Skill when:
- Writing new TypeScript components or functions
- Refactoring existing code
- Fixing type errors from `npm run type-check`
- Reviewing pull requests
- Adding new database queries
- Creating new React Query hooks
- Setting up form validation
