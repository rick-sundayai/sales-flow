import React from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

// Mock user object for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'User',
  },
}

// Mock user profile object
export const mockUserProfile = {
  id: 'test-user-id',
  user_id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  avatar_url: null,
  role: 'user',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

// Mock client object
export const mockClient = {
  id: 'test-client-id',
  user_id: 'test-user-id',
  contact_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company_name: 'Test Corp',
  industry: 'Technology',
  status: 'prospect',
  notes: 'Test client notes',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  last_contact_at: null,
}

// Mock deal object
export const mockDeal = {
  id: 'test-deal-id',
  user_id: 'test-user-id',
  client_id: 'test-client-id',
  title: 'Test Deal',
  description: 'Test deal description',
  value: 10000,
  currency: 'USD',
  stage: 'lead',
  probability: 50,
  priority: 'medium',
  expected_close_date: '2024-12-31',
  actual_close_date: null,
  notes: 'Test deal notes',
  tags: ['test'],
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  stage_changed_at: '2023-01-01T00:00:00.000Z',
}

// Create a wrapper component with all providers
interface AllTheProvidersProps {
  children: React.ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper to create mock functions for Supabase
export const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
})

// Helper to create mock TanStack Query hooks
export const createMockQueryHook = (data: any, isLoading = false, error = null) => ({
  data,
  isLoading,
  error,
  isSuccess: !isLoading && !error,
  isError: !!error,
  refetch: jest.fn(),
})

export const createMockMutationHook = (isLoading = false, error = null) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: isLoading,
  isLoading,
  error,
  isSuccess: !isLoading && !error,
  isError: !!error,
  reset: jest.fn(),
})

// Wait for next tick (useful for async operations)
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to suppress console errors in specific tests
export const suppressConsoleError = (callback: () => void) => {
  const originalError = console.error
  console.error = jest.fn()
  callback()
  console.error = originalError
}

// Add a basic test so this file doesn't fail the "no tests" rule
describe('Test utils', () => {
  it('should export helper functions', () => {
    expect(typeof render).toBe('function')
    expect(typeof createMockSupabaseClient).toBe('function')
    expect(typeof createMockQueryHook).toBe('function')
  })
})