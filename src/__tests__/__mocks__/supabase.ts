import { createMockSupabaseClient, mockUser, mockUserProfile } from '../test-utils'

// Mock Supabase client
export const mockSupabaseClient = createMockSupabaseClient()

// Mock the Supabase client creation functions
export const createClient = jest.fn(() => mockSupabaseClient)

// Mock the server client
export const createServerClient = jest.fn(() => mockSupabaseClient)

// Mock auth helpers
export const createServerComponentClient = jest.fn(() => mockSupabaseClient)
export const createMiddlewareClient = jest.fn(() => mockSupabaseClient)
export const createPagesBrowserClient = jest.fn(() => mockSupabaseClient)
export const createPagesServerClient = jest.fn(() => mockSupabaseClient)

// Default export for ES modules
export default mockSupabaseClient

// Mock specific Supabase modules
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock auth user response
export const mockAuthResponse = {
  data: { user: mockUser },
  error: null,
}

// Mock session response
export const mockSessionResponse = {
  data: { 
    session: {
      user: mockUser,
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    }
  },
  error: null,
}

// Helper functions for setting up different auth states
export const setupAuthenticatedUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue(mockAuthResponse)
  mockSupabaseClient.auth.getSession.mockResolvedValue(mockSessionResponse)
}

export const setupUnauthenticatedUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
}

export const setupAuthError = (message: string = 'Auth error') => {
  const error = new Error(message)
  mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error })
  mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error })
}

// Database mock helpers
export const setupDatabaseSuccess = (data: any) => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  }
  
  mockSupabaseClient.from.mockReturnValue(mockQuery)
  return mockQuery
}

export const setupDatabaseError = (message: string = 'Database error') => {
  const error = new Error(message)
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error }),
  }
  
  mockSupabaseClient.from.mockReturnValue(mockQuery)
  return mockQuery
}