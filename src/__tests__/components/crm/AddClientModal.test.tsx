import React from 'react'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { AddClientModal } from '@/components/crm/AddClientModal'
import { useCreateClient } from '@/lib/queries/clients'
import { useAuth } from '@/hooks/useAuth'
import { mockUser, createMockMutationHook } from '../test-utils'

// Mock the hooks
jest.mock('@/lib/queries/clients', () => ({
  useCreateClient: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

const mockUseCreateClient = useCreateClient as jest.MockedFunction<typeof useCreateClient>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('AddClientModal', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnAdd = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth mock
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
    })
  })

  describe('Form rendering', () => {
    it('should render all form fields when open', () => {
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={false} 
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByLabelText(/contact name/i)).not.toBeInTheDocument()
    })

    it('should populate company name when defaultCompanyName is provided', () => {
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
          defaultCompanyName="Test Corp"
        />
      )

      const companyInput = screen.getByLabelText(/company/i) as HTMLInputElement
      expect(companyInput.value).toBe('Test Corp')
    })
  })

  describe('Form validation', () => {
    it('should show validation error for empty contact name', async () => {
      const user = userEvent.setup()
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      // Try to submit without filling contact name
      const submitButton = screen.getByRole('button', { name: /add client/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/contact name is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup()
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      const nameInput = screen.getByLabelText(/contact name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /add client/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form submission', () => {
    it('should call mutation with correct data on valid submission', async () => {
      const user = userEvent.setup()
      const mockMutate = jest.fn()
      mockUseCreateClient.mockReturnValue({
        ...createMockMutationHook(),
        mutate: mockMutate,
      })

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      // Fill in form fields
      await user.type(screen.getByLabelText(/contact name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+1234567890')
      await user.type(screen.getByLabelText(/company/i), 'Test Corp')
      await user.type(screen.getByLabelText(/notes/i), 'Test notes')

      // Submit form
      await user.click(screen.getByRole('button', { name: /add client/i }))

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          contact_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company_name: 'Test Corp',
          status: 'prospect',
          notes: 'Test notes',
        })
      })
    })

    it('should call onAdd callback when provided', async () => {
      const user = userEvent.setup()
      const mockMutate = jest.fn()
      
      // Mock successful mutation
      mockUseCreateClient.mockReturnValue({
        ...createMockMutationHook(),
        mutate: mockMutate,
        isSuccess: true,
      })

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
          onAdd={mockOnAdd}
        />
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/contact name/i), 'John Doe')
      await user.type(screen.getByLabelText(/company/i), 'Test Corp')
      await user.click(screen.getByRole('button', { name: /add client/i }))

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })

      // Simulate successful mutation by updating the mock
      expect(mockOnAdd).toHaveBeenCalledWith({
        name: 'John Doe',
        email: '',
        phone: '',
        company: 'Test Corp',
        status: 'prospect',
        notes: '',
      })
    })

    it('should close modal on successful submission', async () => {
      const user = userEvent.setup()
      const mockMutate = jest.fn()
      
      mockUseCreateClient.mockReturnValue({
        ...createMockMutationHook(),
        mutate: mockMutate,
        isSuccess: true,
      })

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.type(screen.getByLabelText(/contact name/i), 'John Doe')
      await user.click(screen.getByRole('button', { name: /add client/i }))

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()
      const mockMutate = jest.fn()
      
      mockUseCreateClient.mockReturnValue({
        ...createMockMutationHook(),
        mutate: mockMutate,
        isSuccess: true,
      })

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      const nameInput = screen.getByLabelText(/contact name/i) as HTMLInputElement
      await user.type(nameInput, 'John Doe')
      await user.click(screen.getByRole('button', { name: /add client/i }))

      // After successful submission, form should reset
      await waitFor(() => {
        expect(nameInput.value).toBe('')
      })
    })
  })

  describe('Loading states', () => {
    it('should show loading spinner when mutation is pending', () => {
      mockUseCreateClient.mockReturnValue({
        ...createMockMutationHook(true), // isLoading = true
      })

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should disable submit button when mutation is pending', () => {
      mockUseCreateClient.mockReturnValue({
        ...createMockMutationHook(true), // isLoading = true
      })

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByRole('button', { name: /add client/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error handling', () => {
    it('should display error message when mutation fails', () => {
      const error = new Error('Failed to create client')
      mockUseCreateClient.mockReturnValue({
        ...createMockMutationHook(false, error),
      })

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText(/failed to create client/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
      expect(screen.getByLabelText(/contact name/i)).toBeRequired()
    })

    it('should focus on first input when opened', () => {
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByLabelText(/contact name/i)).toHaveFocus()
    })

    it('should close modal when escape is pressed', async () => {
      const user = userEvent.setup()
      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.keyboard('{Escape}')
      
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('User authentication', () => {
    it('should handle unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        resetPassword: jest.fn(),
      })

      mockUseCreateClient.mockReturnValue(createMockMutationHook())

      render(
        <AddClientModal 
          open={true} 
          onOpenChange={mockOnOpenChange}
        />
      )

      // Modal should still render but submission might be disabled
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})