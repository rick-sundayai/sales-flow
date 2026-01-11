---
name: testing-implementation
description: Guides implementation of Jest tests, React Testing Library patterns, and test coverage strategies. Use when writing tests, debugging test failures, improving coverage, or when the user mentions testing, Jest, React Testing Library, test coverage, or unit tests.
allowed-tools: Read, Grep, Glob, Bash(npm run test*)
context: fork
agent: general-purpose
---

# Testing Implementation Guide

Provides comprehensive guidance for writing tests in the SalesFlow CRM application using Jest and React Testing Library.

## Instructions

Follow these patterns when writing and maintaining tests.

### Testing Stack

The project uses:
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing

### Test File Structure

```
src/__tests__/
├── __mocks__/               # Mock implementations
│   ├── supabase.ts         # Supabase client mocks
│   └── next-router.ts      # Next.js router mocks
├── components/              # Component integration tests
│   ├── crm/
│   │   ├── MetricCard.test.tsx
│   │   ├── DealCard.test.tsx
│   │   └── AddClientModal.test.tsx
│   └── ui/
│       └── button.test.tsx
├── hooks/                   # Custom hook tests
│   └── useAuth.test.tsx
├── queries/                 # TanStack Query hook tests
│   ├── clients.test.ts
│   └── deals.test.ts
├── schemas/                 # Zod validation tests
│   └── clientSchema.test.ts
├── utils/                   # Utility function tests
│   └── formatters.test.ts
└── test-utils.tsx          # Common testing utilities
```

### Test Naming Conventions

```typescript
// ✅ Correct naming
MetricCard.test.tsx         // Component tests
useClients.test.ts          // Hook tests
clientService.test.ts       // Service tests
formatters.test.ts          // Utility tests

// ❌ Wrong naming
MetricCard.spec.tsx         // Use .test.tsx
tests/MetricCard.tsx        // Put in __tests__ folder
MetricCard-test.tsx         // Use .test.tsx
```

### Testing Pyramid Strategy

Follow the testing pyramid for optimal coverage:

1. **Unit Tests (70%)** - Fast, isolated, test single functions
   - Utility functions
   - Validation schemas
   - Pure functions
   - Custom hooks

2. **Integration Tests (20%)** - Test component interactions
   - Component rendering with props
   - User interactions
   - Form submissions
   - State updates

3. **E2E Tests (10%)** - Test critical user flows
   - Authentication flow
   - Deal creation flow
   - Client management flow

### Unit Testing Patterns

#### Testing Utility Functions

```typescript
// src/lib/utils/formatters.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// src/__tests__/utils/formatters.test.ts
import { formatCurrency } from '@/lib/utils/formatters'

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(1234.567)).toBe('$1,234.57')
  })
})
```

#### Testing Validation Schemas

```typescript
// src/lib/schemas/clientSchema.ts
import { z } from 'zod'

export const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})

// src/__tests__/schemas/clientSchema.test.ts
import { clientSchema } from '@/lib/schemas/clientSchema'

describe('clientSchema', () => {
  it('validates correct data', () => {
    const validData = {
      company_name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '555-1234',
    }

    expect(() => clientSchema.parse(validData)).not.toThrow()
  })

  it('rejects missing company name', () => {
    const invalidData = {
      company_name: '',
      email: 'contact@acme.com',
    }

    expect(() => clientSchema.parse(invalidData)).toThrow('Company name is required')
  })

  it('rejects invalid email', () => {
    const invalidData = {
      company_name: 'Acme Corp',
      email: 'invalid-email',
    }

    expect(() => clientSchema.parse(invalidData)).toThrow('Invalid email address')
  })

  it('allows optional phone number', () => {
    const validData = {
      company_name: 'Acme Corp',
      email: 'contact@acme.com',
    }

    expect(() => clientSchema.parse(validData)).not.toThrow()
  })
})
```

### Component Testing Patterns

#### Basic Component Test

```typescript
// src/components/crm/MetricCard.tsx
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

export function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-gray-400">{title}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// src/__tests__/components/crm/MetricCard.test.tsx
import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/crm/MetricCard'
import { Users } from 'lucide-react'

describe('MetricCard', () => {
  it('renders title and value correctly', () => {
    render(
      <MetricCard
        title="Total Clients"
        value={1234}
        icon={<Users data-testid="users-icon" />}
      />
    )

    expect(screen.getByText('Total Clients')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
  })

  it('renders string values', () => {
    render(
      <MetricCard
        title="Status"
        value="Active"
        icon={<Users />}
      />
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
```

#### Testing Interactive Components

```typescript
// src/__tests__/components/crm/AddClientModal.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddClientModal } from '@/components/crm/AddClientModal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Supabase
jest.mock('@/lib/supabase/client')

describe('AddClientModal', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const renderModal = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AddClientModal
          open={true}
          onOpenChange={jest.fn()}
          {...props}
        />
      </QueryClientProvider>
    )
  }

  it('renders form fields', () => {
    renderModal()

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderModal()

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    renderModal({ onOpenChange })

    // Fill form
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/email/i), 'contact@acme.com')
    await user.type(screen.getByLabelText(/phone/i), '555-1234')

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Verify modal closes on success
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('displays error on submission failure', async () => {
    const user = userEvent.setup()

    // Mock failed submission
    const mockSupabase = require('@/lib/supabase/client')
    mockSupabase.createClient.mockReturnValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      })
    })

    renderModal()

    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/email/i), 'contact@acme.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/database error/i)).toBeInTheDocument()
    })
  })
})
```

### Testing React Query Hooks

```typescript
// src/__tests__/queries/clients.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useClients, useAddClient } from '@/lib/queries/clients'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')

describe('useClients', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  beforeEach(() => {
    queryClient.clear()
  })

  it('fetches clients successfully', async () => {
    const mockClients = [
      { id: '1', company_name: 'Acme Corp', email: 'acme@example.com' },
      { id: '2', company_name: 'TechCo', email: 'tech@example.com' },
    ]

    const mockSupabase = createClient as jest.MockedFunction<typeof createClient>
    mockSupabase.mockReturnValue({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: mockClients, error: null })
        })
      })
    } as any)

    const { result } = renderHook(() => useClients(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockClients)
    expect(result.current.data).toHaveLength(2)
  })

  it('handles fetch error', async () => {
    const mockSupabase = createClient as jest.MockedFunction<typeof createClient>
    mockSupabase.mockReturnValue({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    } as any)

    const { result } = renderHook(() => useClients(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

describe('useAddClient', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('adds client successfully', async () => {
    const newClient = {
      company_name: 'New Corp',
      email: 'new@example.com',
    }

    const mockSupabase = createClient as jest.MockedFunction<typeof createClient>
    mockSupabase.mockReturnValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: { id: '3', ...newClient },
              error: null
            })
          })
        })
      })
    } as any)

    const { result } = renderHook(() => useAddClient(), { wrapper })

    result.current.mutate(newClient)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ id: '3', ...newClient })
  })
})
```

### Testing Custom Hooks

```typescript
// src/__tests__/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

jest.mock('@/lib/supabase/client')

describe('useAuth', () => {
  it('returns user when authenticated', () => {
    const mockUser = { id: '1', email: 'test@example.com' }

    // Mock authenticated state
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeDefined()
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('returns null when not authenticated', () => {
    // Mock unauthenticated state
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

### Mock Patterns

#### Mocking Supabase

```typescript
// src/__tests__/__mocks__/supabase.ts
export const createClient = jest.fn(() => ({
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: null },
      error: null
    })),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn(() => ({
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    })),
  })),
}))
```

#### Mocking Next.js Router

```typescript
// src/__tests__/__mocks__/next-router.ts
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}))
```

### Test Utilities

```typescript
// src/__tests__/test-utils.tsx
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

interface AllProvidersProps {
  children: React.ReactNode
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
```

### Coverage Targets

Maintain these minimum coverage thresholds:

```json
{
  "coverageThreshold": {
    "global": {
      "lines": 70,
      "functions": 70,
      "branches": 70,
      "statements": 70
    }
  }
}
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test MetricCard.test.tsx

# Run tests for specific pattern
npm run test queries/
```

### Best Practices

1. **Test behavior, not implementation** - Focus on what users see and do
2. **Use data-testid sparingly** - Prefer accessible queries (getByRole, getByLabelText)
3. **Mock external dependencies** - Mock Supabase, APIs, routers
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive test names** - Clearly state what is being tested
6. **Follow AAA pattern** - Arrange, Act, Assert
7. **Clean up after tests** - Clear query cache, reset mocks

### Common Pitfalls

```typescript
// ❌ Wrong - testing implementation details
expect(component.state.isOpen).toBe(true)

// ✅ Correct - testing user-visible behavior
expect(screen.getByRole('dialog')).toBeVisible()

// ❌ Wrong - using querySelector
expect(container.querySelector('.button')).toBeInTheDocument()

// ✅ Correct - using accessible queries
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()

// ❌ Wrong - not waiting for async operations
fireEvent.click(button)
expect(screen.getByText('Success')).toBeInTheDocument()

// ✅ Correct - waiting for async operations
await user.click(button)
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

## Resources

- Jest documentation: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Testing Library queries: https://testing-library.com/docs/queries/about
- Common mistakes: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## When to Apply This Skill

Use this Skill when:
- Writing new tests for components, hooks, or utilities
- Debugging failing tests
- Improving test coverage
- Refactoring test code
- Setting up mocks for external dependencies
- Reviewing test code in pull requests
