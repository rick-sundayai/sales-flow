import { 
  createClientSchema,
  updateClientSchema,
  createDealSchema,
  updateDealSchema,
  createActivitySchema,
  activityTypeSchema,
  clientStatusSchema,
  dealStageSchema,
  validateData,
  safeParseData,
  formatValidationErrors,
  composeEmailSchema,
  searchQuerySchema,
} from '@/lib/schemas/validation'
import { z } from 'zod'

describe('Validation Schemas', () => {
  describe('Client Schemas', () => {
    describe('createClientSchema', () => {
      it('should validate a valid client', () => {
        const validClient = {
          contact_name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company_name: 'Example Corp',
          status: 'prospect' as const,
          industry: 'Technology',
          notes: 'Test notes',
        }

        const result = createClientSchema.safeParse(validClient)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validClient)
        }
      })

      it('should require contact name', () => {
        const invalidClient = {
          email: 'john@example.com',
        }

        const result = createClientSchema.safeParse(invalidClient)
        expect(result.success).toBe(false)
        if (!result.success) {
          const contactNameError = result.error.errors.find(e => e.path.includes('contact_name'))
          expect(contactNameError).toBeDefined()
        }
      })

      it('should validate email format', () => {
        const invalidClient = {
          contact_name: 'John Doe',
          email: 'invalid-email',
        }

        const result = createClientSchema.safeParse(invalidClient)
        expect(result.success).toBe(false)
        if (!result.success) {
          const emailError = result.error.errors.find(e => e.path.includes('email'))
          expect(emailError).toBeDefined()
        }
      })

      it('should allow empty email', () => {
        const validClient = {
          contact_name: 'John Doe',
          email: '',
        }

        const result = createClientSchema.safeParse(validClient)
        expect(result.success).toBe(true)
      })

      it('should enforce contact name length limits', () => {
        const invalidClient = {
          contact_name: 'A'.repeat(101), // Too long
        }

        const result = createClientSchema.safeParse(invalidClient)
        expect(result.success).toBe(false)
        if (!result.success) {
          const lengthError = result.error.errors.find(e => e.message.includes('too long'))
          expect(lengthError).toBeDefined()
        }
      })

      it('should validate client status enum', () => {
        const invalidClient = {
          contact_name: 'John Doe',
          status: 'invalid-status',
        }

        const result = createClientSchema.safeParse(invalidClient)
        expect(result.success).toBe(false)
      })

      it('should set default status to prospect', () => {
        const client = {
          contact_name: 'John Doe',
        }

        const result = createClientSchema.safeParse(client)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe('prospect')
        }
      })
    })

    describe('updateClientSchema', () => {
      it('should require id for updates', () => {
        const updateData = {
          contact_name: 'Updated Name',
        }

        const result = updateClientSchema.safeParse(updateData)
        expect(result.success).toBe(false)
        if (!result.success) {
          const idError = result.error.errors.find(e => e.path.includes('id'))
          expect(idError).toBeDefined()
        }
      })

      it('should validate UUID format for id', () => {
        const updateData = {
          id: 'invalid-uuid',
          contact_name: 'Updated Name',
        }

        const result = updateClientSchema.safeParse(updateData)
        expect(result.success).toBe(false)
        if (!result.success) {
          const uuidError = result.error.errors.find(e => e.message.includes('Invalid UUID'))
          expect(uuidError).toBeDefined()
        }
      })

      it('should allow partial updates', () => {
        const updateData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          contact_name: 'Updated Name',
        }

        const result = updateClientSchema.safeParse(updateData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Deal Schemas', () => {
    describe('createDealSchema', () => {
      it('should validate a valid deal', () => {
        const validDeal = {
          title: 'Test Deal',
          value: 10000,
          stage: 'lead' as const,
          priority: 'medium' as const,
          probability: 50,
          expected_close_date: '2024-12-31T00:00:00.000Z',
          client_id: '123e4567-e89b-12d3-a456-426614174000',
        }

        const result = createDealSchema.safeParse(validDeal)
        expect(result.success).toBe(true)
      })

      it('should require title', () => {
        const invalidDeal = {
          value: 10000,
          client_id: '123e4567-e89b-12d3-a456-426614174000',
        }

        const result = createDealSchema.safeParse(invalidDeal)
        expect(result.success).toBe(false)
        if (!result.success) {
          const titleError = result.error.errors.find(e => e.path.includes('title'))
          expect(titleError).toBeDefined()
        }
      })

      it('should enforce positive value', () => {
        const invalidDeal = {
          title: 'Test Deal',
          value: -1000,
          client_id: '123e4567-e89b-12d3-a456-426614174000',
        }

        const result = createDealSchema.safeParse(invalidDeal)
        expect(result.success).toBe(false)
        if (!result.success) {
          const valueError = result.error.errors.find(e => e.message.includes('positive'))
          expect(valueError).toBeDefined()
        }
      })

      it('should validate probability range', () => {
        const invalidDeal = {
          title: 'Test Deal',
          value: 10000,
          probability: 150, // Invalid: > 100
          client_id: '123e4567-e89b-12d3-a456-426614174000',
        }

        const result = createDealSchema.safeParse(invalidDeal)
        expect(result.success).toBe(false)
        if (!result.success) {
          const probabilityError = result.error.errors.find(e => e.message.includes('0-100'))
          expect(probabilityError).toBeDefined()
        }
      })

      it('should validate deal stage enum', () => {
        const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
        
        for (const stage of validStages) {
          const deal = {
            title: 'Test Deal',
            value: 10000,
            stage,
            client_id: '123e4567-e89b-12d3-a456-426614174000',
          }

          const result = createDealSchema.safeParse(deal)
          expect(result.success).toBe(true)
        }
      })
    })
  })

  describe('Activity Schemas', () => {
    describe('createActivitySchema', () => {
      it('should validate a valid activity', () => {
        const validActivity = {
          type: 'call' as const,
          title: 'Follow-up call',
          description: 'Call to discuss proposal',
          client_id: '123e4567-e89b-12d3-a456-426614174000',
          completed: false,
        }

        const result = createActivitySchema.safeParse(validActivity)
        expect(result.success).toBe(true)
      })

      it('should require title', () => {
        const invalidActivity = {
          type: 'call' as const,
        }

        const result = createActivitySchema.safeParse(invalidActivity)
        expect(result.success).toBe(false)
        if (!result.success) {
          const titleError = result.error.errors.find(e => e.path.includes('title'))
          expect(titleError).toBeDefined()
        }
      })

      it('should validate activity type enum', () => {
        const validTypes = ['email', 'call', 'meeting', 'task', 'note']
        
        for (const type of validTypes) {
          const activity = {
            type,
            title: 'Test Activity',
          }

          const result = createActivitySchema.safeParse(activity)
          expect(result.success).toBe(true)
        }
      })

      it('should set default completed to false', () => {
        const activity = {
          type: 'task' as const,
          title: 'Test Task',
        }

        const result = createActivitySchema.safeParse(activity)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.completed).toBe(false)
        }
      })
    })
  })

  describe('Email Schema', () => {
    describe('composeEmailSchema', () => {
      it('should validate a valid email', () => {
        const validEmail = {
          to: 'recipient@example.com',
          subject: 'Test Subject',
          body: 'Test email body',
        }

        const result = composeEmailSchema.safeParse(validEmail)
        expect(result.success).toBe(true)
      })

      it('should require to field', () => {
        const invalidEmail = {
          subject: 'Test Subject',
          body: 'Test email body',
        }

        const result = composeEmailSchema.safeParse(invalidEmail)
        expect(result.success).toBe(false)
      })

      it('should validate email format in to field', () => {
        const invalidEmail = {
          to: 'invalid-email',
          subject: 'Test Subject',
          body: 'Test email body',
        }

        const result = composeEmailSchema.safeParse(invalidEmail)
        expect(result.success).toBe(false)
        if (!result.success) {
          const emailError = result.error.errors.find(e => e.message.includes('Invalid recipient email'))
          expect(emailError).toBeDefined()
        }
      })

      it('should validate CC array emails', () => {
        const invalidEmail = {
          to: 'recipient@example.com',
          cc: ['invalid-email'],
          subject: 'Test Subject',
          body: 'Test email body',
        }

        const result = composeEmailSchema.safeParse(invalidEmail)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Utility Functions', () => {
    describe('validateData', () => {
      it('should return success for valid data', () => {
        const data = { contact_name: 'John Doe' }
        const result = validateData(createClientSchema, data)
        
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.contact_name).toBe('John Doe')
        }
      })

      it('should return error for invalid data', () => {
        const data = { contact_name: '' } // Empty name is invalid
        const result = validateData(createClientSchema, data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.errors).toBeInstanceOf(z.ZodError)
        }
      })
    })

    describe('safeParseData', () => {
      it('should return parsed data for valid input', () => {
        const data = { contact_name: 'John Doe' }
        const result = safeParseData(createClientSchema, data)
        
        expect(result).toBeDefined()
        expect(result?.contact_name).toBe('John Doe')
      })

      it('should return undefined for invalid input', () => {
        const data = { contact_name: '' } // Invalid
        const result = safeParseData(createClientSchema, data)
        
        expect(result).toBeUndefined()
      })
    })

    describe('formatValidationErrors', () => {
      it('should format validation errors correctly', () => {
        const schema = z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Invalid email'),
        })

        const data = { name: '', email: 'invalid' }
        const parseResult = schema.safeParse(data)
        
        if (!parseResult.success) {
          const formatted = formatValidationErrors(parseResult.error)
          
          expect(formatted.name).toBe('Name is required')
          expect(formatted.email).toBe('Invalid email')
        }
      })

      it('should handle nested field errors', () => {
        const schema = z.object({
          user: z.object({
            name: z.string().min(1, 'Name required'),
          })
        })

        const data = { user: { name: '' } }
        const parseResult = schema.safeParse(data)
        
        if (!parseResult.success) {
          const formatted = formatValidationErrors(parseResult.error)
          
          expect(formatted['user.name']).toBe('Name required')
        }
      })
    })
  })
})