---
name: supabase-query-patterns
description: Ensures proper React Query and Supabase patterns for data fetching, mutations, and state management. Use when implementing database queries, creating mutations, fetching data, or when the user mentions Supabase, React Query, TanStack Query, data fetching, or mutations.
allowed-tools: Read, Grep, Glob, Bash(npm run lint)
---

# Supabase + React Query Pattern Enforcer

Enforces consistent data fetching and mutation patterns for the SalesFlow CRM application.

## Instructions

Follow these patterns when working with Supabase and React Query in the codebase.

### File Organization

Organize query-related code by domain:

```
src/lib/
├── queries/               # React Query hooks
│   ├── clients.ts        # useClients, useAddClient, useUpdateClient
│   ├── deals.ts          # useDeals, useAddDeal, useUpdateDeal
│   ├── activities.ts     # useActivities, useAddActivity
│   ├── meetings.ts       # useMeetings, useScheduleMeeting
│   └── dashboard.ts      # useDashboardMetrics
├── services/             # Business logic
│   ├── clientService.ts
│   └── dealService.ts
└── supabase/
    ├── client.ts         # Client-side Supabase client
    ├── server.ts         # Server-side Supabase client
    └── middleware.ts     # Middleware Supabase client
```

### Data Fetching Patterns

#### Server-Side Data Fetching (Preferred for Initial Loads)

Use server components for initial page data:

```typescript
// src/app/dashboard/clients/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return <div>Error loading clients</div>
  }

  return <ClientList initialClients={clients} />
}
```

**Key points:**
- Use `createClient()` from `@/lib/supabase/server`
- Server components can be async
- Handle errors gracefully
- Pass data as props to client components

#### Client-Side Data Fetching with React Query

For interactive components that need refetching:

```typescript
// src/lib/queries/clients.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types/database'

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch clients: ${error.message}`)
      }

      return data as Client[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

**Key points:**
- Always throw errors (don't return null)
- Use descriptive error messages
- Set appropriate `staleTime` to reduce unnecessary requests
- Type the return value

#### Filtered Queries

Use query parameters for filtering:

```typescript
export function useClientsByStatus(status: string) {
  return useQuery({
    queryKey: ['clients', 'status', status],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!status, // Only run if status is provided
  })
}
```

**Key points:**
- Include filter params in queryKey for proper caching
- Use `enabled` to conditionally execute queries
- Keep queryKeys consistent across the app

### Mutation Patterns

#### Adding Data (Create)

```typescript
// src/lib/queries/clients.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types/database'

interface AddClientData {
  company_name: string
  contact_name: string
  email: string
  phone?: string
  status: 'lead' | 'prospect' | 'active' | 'inactive'
}

export function useAddClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientData: AddClientData) => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add client: ${error.message}`)
      }

      return data as Client
    },
    onSuccess: (newClient) => {
      // Invalidate and refetch clients query
      queryClient.invalidateQueries({ queryKey: ['clients'] })

      // Optional: Add optimistic update
      queryClient.setQueryData<Client[]>(['clients'], (old) => {
        if (!old) return [newClient]
        return [newClient, ...old]
      })
    },
    onError: (error) => {
      console.error('Error adding client:', error)
      // Show error toast/notification
    },
  })
}
```

**Key points:**
- Always invalidate related queries on success
- Consider optimistic updates for better UX
- Handle errors in `onError` callback
- Return the created data with `.select().single()`

#### Updating Data

```typescript
interface UpdateClientData {
  id: string
  updates: Partial<AddClientData>
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateClientData) => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Client
    },
    onSuccess: (updatedClient) => {
      // Invalidate all client queries
      queryClient.invalidateQueries({ queryKey: ['clients'] })

      // Update specific client in cache
      queryClient.setQueryData<Client>(
        ['clients', updatedClient.id],
        updatedClient
      )
    },
  })
}
```

#### Deleting Data

```typescript
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const supabase = createClient()

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      return clientId
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })

      // Optimistic removal from cache
      queryClient.setQueryData<Client[]>(['clients'], (old) => {
        if (!old) return []
        return old.filter(client => client.id !== deletedId)
      })
    },
  })
}
```

### Optimistic Updates

For better UX, implement optimistic updates:

```typescript
export function useToggleClientStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clients'] })

      // Snapshot previous value
      const previousClients = queryClient.getQueryData<Client[]>(['clients'])

      // Optimistically update
      queryClient.setQueryData<Client[]>(['clients'], (old) => {
        if (!old) return []
        return old.map(client =>
          client.id === id
            ? { ...client, status: newStatus }
            : client
        )
      })

      // Return snapshot for rollback
      return { previousClients }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients)
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
```

### Complex Queries with Joins

For queries that need related data:

```typescript
export function useDealsWithClients() {
  return useQuery({
    queryKey: ['deals', 'with-clients'],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients (
            id,
            company_name,
            contact_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}
```

### Real-time Subscriptions

For live updates:

```typescript
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeClients() {
  const queryClient = useQueryClient()
  const { data: clients, ...query } = useClients()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
        },
        () => {
          // Invalidate queries when data changes
          queryClient.invalidateQueries({ queryKey: ['clients'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return { data: clients, ...query }
}
```

### Error Handling Standards

Always handle errors consistently:

```typescript
// ✅ Good - descriptive error messages
if (error) {
  throw new Error(`Failed to fetch clients: ${error.message}`)
}

// ✅ Good - specific error handling
if (error) {
  if (error.code === 'PGRST116') {
    throw new Error('Client not found')
  }
  throw new Error(`Database error: ${error.message}`)
}

// ❌ Bad - generic error
if (error) throw error

// ❌ Bad - silent failure
if (error) return null
```

### Query Key Conventions

Maintain consistent query key structure:

```typescript
// ✅ Consistent structure
['clients']                           // All clients
['clients', clientId]                 // Single client
['clients', 'status', status]         // Filtered by status
['clients', 'search', searchTerm]     // Search results

['deals']                             // All deals
['deals', dealId]                     // Single deal
['deals', 'stage', stage]             // Filtered by stage
['deals', 'client', clientId]         // Deals for client

// ❌ Inconsistent
['getClients']
['client-list']
[clientId, 'client']
```

### Component Usage Pattern

In components, destructure what you need:

```typescript
'use client'

import { useClients, useAddClient } from '@/lib/queries/clients'

export function ClientList() {
  const { data: clients, isLoading, error } = useClients()
  const addClient = useAddClient()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!clients) return <div>No clients found</div>

  const handleAddClient = async (formData: AddClientData) => {
    try {
      await addClient.mutateAsync(formData)
      // Show success toast
    } catch (err) {
      // Show error toast
    }
  }

  return (
    <div>
      {clients.map(client => (
        <ClientRow key={client.id} client={client} />
      ))}
    </div>
  )
}
```

## Common Pitfalls to Avoid

1. **Don't fetch in client components for initial load** - Use server components
2. **Don't forget to invalidate queries** - Always invalidate after mutations
3. **Don't use inconsistent query keys** - Follow the convention
4. **Don't ignore errors** - Always throw or handle them
5. **Don't fetch too frequently** - Set appropriate `staleTime`
6. **Don't forget Row Level Security** - Ensure RLS policies are configured
7. **Don't bypass types** - Use generated Supabase types

## Resources

- TanStack Query docs: https://tanstack.com/query/latest/docs/react/overview
- Supabase Client docs: https://supabase.com/docs/reference/javascript/introduction
- Next.js data fetching: https://nextjs.org/docs/app/building-your-application/data-fetching

## When to Apply This Skill

Use this Skill when:
- Creating new data fetching hooks
- Implementing mutations (create, update, delete)
- Refactoring query logic
- Debugging data fetching issues
- Setting up real-time subscriptions
- Reviewing data layer code
