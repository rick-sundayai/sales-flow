---
name: component-architecture
description: Ensures consistent React component structure, shadcn/ui patterns, and proper Server/Client Component distinction. Use when creating components, refactoring React code, setting up forms, or when the user mentions React components, Server Components, Client Components, shadcn/ui, or component architecture.
allowed-tools: Read, Grep, Glob, Edit
---

# Component Architecture Standards

Enforces consistent component structure and patterns for the SalesFlow CRM application.

## Instructions

Follow these patterns when creating or refactoring React components.

### File Structure and Organization

```
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Route groups for organization
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # Protected routes
│   │   ├── clients/
│   │   │   └── page.tsx         # Server Component (default)
│   │   ├── pipeline/
│   │   └── layout.tsx           # Shared layout
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # shadcn/ui components (50+ components)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── crm/                      # Business logic components
│   │   ├── AddClientModal.tsx
│   │   ├── DealCard.tsx
│   │   ├── PipelineColumn.tsx
│   │   └── ...
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── DashboardHeader.tsx
│   │   └── MetricsGrid.tsx
│   ├── layout/                   # App shell components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── auth/                     # Authentication components
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
```

### Server Components vs Client Components

#### Server Components (Default)

Server Components are the default in Next.js 15 App Router. Use them for:

- **Page components** - Initial page renders
- **Layouts** - Shared UI structure
- **Static content** - Content that doesn't need interactivity
- **Data fetching** - Components that fetch and display data
- **SEO-critical content** - Meta tags, structured data

```typescript
// src/app/dashboard/clients/page.tsx
// No 'use client' - this is a Server Component

import { createClient } from '@/lib/supabase/server'
import { ClientList } from '@/components/crm/ClientList'

export default async function ClientsPage() {
  const supabase = await createClient()

  // Data fetching in Server Component
  const { data: clients } = await supabase
    .from('clients')
    .select('*')

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Clients</h1>
      <ClientList initialClients={clients} />
    </div>
  )
}
```

**Server Component characteristics:**
- Can be async functions
- Can't use React hooks (useState, useEffect, etc.)
- Can't use browser APIs
- Can access backend resources directly (databases, file system)
- Can use sensitive environment variables
- Bundle size doesn't affect client JavaScript

#### Client Components

Add `'use client'` directive for components that need:

- **React hooks** - useState, useEffect, useContext, etc.
- **Event handlers** - onClick, onChange, onSubmit
- **Browser APIs** - localStorage, window, document
- **React Query** - useQuery, useMutation
- **Third-party libraries** that use hooks or browser APIs

```typescript
// src/components/crm/AddClientModal.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAddClient } from '@/lib/queries/clients'

const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface AddClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddClientModal({ open, onOpenChange }: AddClientModalProps) {
  const addClient = useAddClient()
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      await addClient.mutateAsync(data)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Failed to add client:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        {/* Form content */}
      </DialogContent>
    </Dialog>
  )
}
```

**Client Component characteristics:**
- Must have `'use client'` at the top of the file
- Can use all React hooks
- Can handle user interactions
- Bundle size affects client JavaScript
- Can't directly access backend resources

#### Composition Pattern (Best Practice)

Mix Server and Client Components for optimal performance:

```typescript
// Server Component (page)
export default async function DashboardPage() {
  const metrics = await fetchMetrics() // Server-side data fetching

  return (
    <div>
      {/* Server Component - static content */}
      <DashboardHeader />

      {/* Pass server data to Client Component */}
      <MetricsGrid initialMetrics={metrics} />

      {/* Client Component for interactivity */}
      <QuickActions />
    </div>
  )
}
```

### shadcn/ui Component Usage

The project uses shadcn/ui with the following configuration:

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### Using shadcn/ui Components

```typescript
// ✅ Correct - import from @/components/ui
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'

// ❌ Wrong - don't import from node_modules
import { Button } from 'shadcn/ui'
```

#### Common shadcn/ui Patterns

**Buttons:**
```typescript
import { Button } from '@/components/ui/button'

<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Dialogs/Modals:**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

**Forms with react-hook-form:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormData = z.infer<typeof schema>

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

**Cards:**
```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Footer actions */}
  </CardFooter>
</Card>
```

### Component Naming Conventions

Follow these naming patterns:

```typescript
// ✅ Correct naming
MetricCard.tsx          // PascalCase for components
ClientList.tsx          // Descriptive names
AddClientModal.tsx      // Action + Entity + Type
useClients.ts           // Hooks start with 'use'

// ❌ Wrong naming
metricCard.tsx          // camelCase
client-list.tsx         // kebab-case
Modal.tsx               // Too generic
```

### Props Interface Patterns

Always define explicit props interfaces:

```typescript
// ✅ Correct - interface with Props suffix
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

export function MetricCard({ title, value, icon, trend, onClick }: MetricCardProps) {
  // Component implementation
}

// ✅ Alternative - type alias
type ClientRowProps = {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
}

// ❌ Wrong - inline props
export function MetricCard({ title, value }: { title: string; value: number }) {
  // Hard to reuse, not exportable
}
```

### Children Pattern

For wrapper components:

```typescript
interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('container mx-auto p-6', className)}>
      {children}
    </div>
  )
}
```

### Conditional Rendering Patterns

```typescript
// ✅ Good - early returns for loading/error states
export function ClientList() {
  const { data: clients, isLoading, error } = useClients()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!clients || clients.length === 0) return <EmptyState />

  return (
    <div className="space-y-4">
      {clients.map(client => (
        <ClientRow key={client.id} client={client} />
      ))}
    </div>
  )
}

// ❌ Bad - nested ternaries
export function ClientList() {
  const { data: clients, isLoading, error } = useClients()

  return isLoading ? <LoadingSpinner /> : error ? <ErrorMessage /> : clients ? (
    <div>{clients.map(/* ... */)}</div>
  ) : <EmptyState />
}
```

### Event Handler Patterns

```typescript
// ✅ Correct - inline arrow functions for simple handlers
<Button onClick={() => setOpen(true)}>Open</Button>

// ✅ Correct - separate functions for complex handlers
const handleSubmit = async (data: FormData) => {
  try {
    await mutation.mutateAsync(data)
    setOpen(false)
    form.reset()
  } catch (error) {
    console.error(error)
  }
}

<form onSubmit={form.handleSubmit(handleSubmit)}>
  {/* Form fields */}
</form>

// ❌ Wrong - creating new function on every render unnecessarily
<Button onClick={function() { setOpen(true) }}>Open</Button>
```

### Path Aliases

Always use `@/*` path aliases:

```typescript
// ✅ Correct
import { Button } from '@/components/ui/button'
import { useClients } from '@/lib/queries/clients'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types/database'

// ❌ Wrong - relative paths
import { Button } from '../../../components/ui/button'
import { useClients } from '../../lib/queries/clients'
```

### Component Size Guidelines

Keep components focused and manageable:

- **Small components**: < 100 lines
- **Medium components**: 100-200 lines
- **Large components**: > 200 lines (consider splitting)

If a component exceeds 200 lines:
1. Extract reusable parts into separate components
2. Move complex logic to custom hooks
3. Split into multiple files if needed

### Accessibility Standards

Ensure components are accessible:

```typescript
// ✅ Good - semantic HTML and ARIA labels
<button
  type="button"
  aria-label="Close modal"
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</button>

// ✅ Good - keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
  Click me
</div>

// ❌ Bad - missing labels
<button onClick={handleClose}>
  <X />
</button>
```

## Common Patterns in This Project

### Modal Pattern

All modals follow this structure:

```typescript
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // ... other props
}

export function MyModal({ open, onOpenChange }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        {/* Modal content */}
      </DialogContent>
    </Dialog>
  )
}
```

### List Item Pattern

For rendering list items:

```typescript
interface ItemRowProps {
  item: Item
  onEdit?: (item: Item) => void
  onDelete?: (id: string) => void
}

export function ItemRow({ item, onEdit, onDelete }: ItemRowProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-sm text-gray-600">{item.description}</p>
      </div>
      <div className="flex gap-2">
        {onEdit && (
          <Button variant="ghost" onClick={() => onEdit(item)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" onClick={() => onDelete(item.id)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
```

## Resources

- Next.js Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- shadcn/ui documentation: https://ui.shadcn.com
- React Hook Form: https://react-hook-form.com
- Zod validation: https://zod.dev

## When to Apply This Skill

Use this Skill when:
- Creating new React components
- Refactoring existing components
- Deciding between Server/Client Components
- Implementing forms with shadcn/ui
- Setting up modal dialogs
- Organizing component structure
- Reviewing component code
