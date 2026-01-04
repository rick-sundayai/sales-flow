import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { authService } from '@/lib/auth/auth-service'
import { mockUser, mockUserProfile } from '../test-utils'

// Mock the auth service
jest.mock('@/lib/auth/auth-service', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    getUserProfile: jest.fn(),
    onAuthStateChange: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
  },
}))

const mockAuthService = authService as jest.Mocked<typeof authService>

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockAuthService.onAuthStateChange.mockImplementation(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    }))
  })

  describe('Initial state', () => {
    it('should start with loading state', () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
    })

    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Authentication state management', () => {
    it('should set user and profile on successful authentication', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: mockUser as any,
        profile: mockUserProfile,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockUserProfile)
    })

    it('should handle no user state', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
    })
  })

  describe('Auth state change handling', () => {
    it('should handle auth state changes', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      mockAuthService.getUserProfile.mockResolvedValue(mockUserProfile)

      // Mock auth state change callback
      let authCallback: (user: any) => void = () => {}
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        }
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Simulate user login
      await act(async () => {
        authCallback(mockUser)
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockUserProfile)
      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(mockUser.id)
    })

    it('should handle auth state logout', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        user: mockUser as any,
        profile: mockUserProfile,
      })

      let authCallback: (user: any) => void = () => {}
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        }
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial authentication
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Simulate logout
      await act(async () => {
        authCallback(null)
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
    })
  })

  describe('Auth methods', () => {
    it('should call login service method', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      const loginData = { email: 'test@example.com', password: 'password' }
      mockAuthService.login.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.login(loginData)
      })

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData)
    })

    it('should call register service method', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      const registerData = {
        email: 'test@example.com',
        password: 'password',
        first_name: 'Test',
        last_name: 'User',
      }
      mockAuthService.register.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.register(registerData)
      })

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData)
    })

    it('should call logout service method', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      mockAuthService.logout.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockAuthService.logout).toHaveBeenCalled()
    })

    it('should call resetPassword service method', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      const resetData = { email: 'test@example.com' }
      mockAuthService.resetPassword.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.resetPassword(resetData)
      })

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetData)
    })
  })

  describe('Loading states', () => {
    it('should handle loading state properly during authentication check', () => {
      // Mock a pending promise
      mockAuthService.getCurrentUser.mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.loading).toBe(true)
    })

    it('should set loading to false after authentication check completes', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle auth service errors gracefully', async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
    })

    it('should handle getUserProfile errors', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      mockAuthService.getUserProfile.mockRejectedValue(new Error('Profile error'))

      let authCallback: (user: any) => void = () => {}
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        }
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        authCallback(mockUser)
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toBe(null) // Should not crash but profile should be null
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const unsubscribeMock = jest.fn()
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      mockAuthService.onAuthStateChange.mockImplementation(() => ({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      }))

      const { unmount } = renderHook(() => useAuth(), { wrapper })

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })
})