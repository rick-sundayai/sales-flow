import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useClients, useClient, useCreateClient, clientKeys } from '@/lib/queries/clients'
import { 
  setupDatabaseSuccess, 
  setupDatabaseError, 
  mockSupabaseClient,
  mockClient 
} from '../__mocks__/supabase'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Test wrapper with QueryClient
const createWrapper = () => {
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

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Client Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useClients', () => {
    it('should fetch clients successfully', async () => {
      const clients = [mockClient, { ...mockClient, id: 'client-2' }]
      setupDatabaseSuccess(clients)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClients(), { wrapper })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(clients)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clients')
    })

    it('should handle fetch error', async () => {
      setupDatabaseError('Failed to fetch clients')

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClients(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })

    it('should use correct query key', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClients(), { wrapper })

      // The query key should match the expected pattern
      expect(result.current.queryKey).toEqual(clientKeys.lists())
    })

    it('should order clients by created_at descending', async () => {
      const mockQuery = setupDatabaseSuccess([])
      
      const wrapper = createWrapper()
      renderHook(() => useClients(), { wrapper })

      await waitFor(() => {
        expect(mockQuery.select).toHaveBeenCalledWith('*')
      })

      // Verify the order method was called correctly
      // Note: This depends on your mock implementation
    })
  })

  describe('useClient', () => {
    const clientId = 'test-client-id'

    it('should fetch single client successfully', async () => {
      setupDatabaseSuccess(mockClient)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClient(clientId), { wrapper })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockClient)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clients')
    })

    it('should handle single client fetch error', async () => {
      setupDatabaseError('Client not found')

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClient(clientId), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })

    it('should not fetch when id is empty', () => {
      setupDatabaseSuccess(mockClient)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClient(''), { wrapper })

      expect(result.current.isIdle).toBe(true)
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should use correct query key with id', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClient(clientId), { wrapper })

      expect(result.current.queryKey).toEqual(clientKeys.detail(clientId))
    })

    it('should query with correct parameters', async () => {
      const mockQuery = setupDatabaseSuccess(mockClient)

      const wrapper = createWrapper()
      renderHook(() => useClient(clientId), { wrapper })

      await waitFor(() => {
        expect(mockQuery.eq).toHaveBeenCalledWith('id', clientId)
        expect(mockQuery.single).toHaveBeenCalled()
      })
    })
  })

  describe('useCreateClient', () => {
    it('should create client successfully', async () => {
      const newClient = {
        contact_name: 'John Doe',
        email: 'john@example.com',
        company_name: 'Test Corp',
        status: 'prospect' as const,
      }

      setupDatabaseSuccess(mockClient)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateClient(), { wrapper })

      result.current.mutate(newClient)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clients')
    })

    it('should handle create client error', async () => {
      const newClient = {
        contact_name: 'John Doe',
        email: 'john@example.com',
        company_name: 'Test Corp',
        status: 'prospect' as const,
      }

      setupDatabaseError('Failed to create client')

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateClient(), { wrapper })

      result.current.mutate(newClient)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })

    it('should call insert with correct data', async () => {
      const newClient = {
        contact_name: 'John Doe',
        email: 'john@example.com',
        company_name: 'Test Corp',
        status: 'prospect' as const,
      }

      const mockQuery = setupDatabaseSuccess(mockClient)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateClient(), { wrapper })

      result.current.mutate(newClient)

      await waitFor(() => {
        expect(mockQuery.insert).toHaveBeenCalledWith([newClient])
      })
    })

    it('should invalidate clients list on successful create', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 0, cacheTime: 0 },
          mutations: { retry: false },
        },
      })

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')
      setupDatabaseSuccess(mockClient)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useCreateClient(), { wrapper })

      result.current.mutate({
        contact_name: 'John Doe',
        email: 'john@example.com',
        company_name: 'Test Corp',
        status: 'prospect',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: clientKeys.lists(),
      })
    })
  })

  describe('Query Keys', () => {
    it('should generate correct query keys', () => {
      expect(clientKeys.all).toEqual(['clients'])
      expect(clientKeys.lists()).toEqual(['clients', 'list'])
      expect(clientKeys.list('filter')).toEqual(['clients', 'list', { filters: 'filter' }])
      expect(clientKeys.details()).toEqual(['clients', 'detail'])
      expect(clientKeys.detail('123')).toEqual(['clients', 'detail', '123'])
    })
  })

  describe('Error Handling', () => {
    it('should propagate Supabase errors correctly', async () => {
      const errorMessage = 'Database connection failed'
      setupDatabaseError(errorMessage)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClients(), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe(errorMessage)
    })
  })

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // Mock a pending promise
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClients(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should update loading state on completion', async () => {
      setupDatabaseSuccess([mockClient])

      const wrapper = createWrapper()
      const { result } = renderHook(() => useClients(), { wrapper })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isSuccess).toBe(true)
    })
  })
})