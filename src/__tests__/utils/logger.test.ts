import { logger } from '@/lib/utils/logger'

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

beforeAll(() => {
  // Replace console methods with mocks
  Object.assign(console, mockConsole)
})

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole)
})

beforeEach(() => {
  // Clear all mocks before each test
  Object.values(mockConsole).forEach(mock => mock.mockClear())
})

describe('Logger', () => {
  describe('log levels in test environment', () => {
    // In test environment (NODE_ENV=test), only warn and error should log
    it('should log warn messages', () => {
      logger.warn('Warning message')
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      )
    })

    it('should log error messages', () => {
      logger.error('Error message')
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message')
      )
    })

    it('should not log debug messages in test environment', () => {
      logger.debug('Debug message')
      
      expect(console.debug).not.toHaveBeenCalled()
    })

    it('should not log info messages in test environment', () => {
      logger.info('Info message')
      
      expect(console.info).not.toHaveBeenCalled()
    })
  })

  describe('context logging', () => {
    it('should include context in error messages', () => {
      const context = {
        userId: 'user-123',
        action: 'create_client',
        metadata: { clientName: 'Test Corp' }
      }
      
      logger.error('Operation failed', context)
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Operation failed')
      )
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('"userId": "user-123"')
      )
    })

    it('should handle error objects in context', () => {
      const error = new Error('Test error')
      const context = {
        userId: 'user-123',
        error
      }
      
      logger.warn('Operation had issues', context)
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Operation had issues')
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"userId": "user-123"')
      )
    })
  })

  describe('convenience methods', () => {
    it('should log API calls with error status as error', () => {
      logger.apiCall('/api/clients', 'POST', 500, 'user-123')
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] API POST /api/clients - 500')
      )
    })

    it('should not log API calls with success status in test environment', () => {
      logger.apiCall('/api/clients', 'POST', 201, 'user-123')
      
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should log failed database queries as error', () => {
      const error = new Error('Database constraint violation')
      
      logger.databaseQuery('clients', 'INSERT', 'user-123', error)
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Database INSERT failed on clients')
      )
    })

    it('should not log successful database queries in test environment', () => {
      logger.databaseQuery('clients', 'INSERT', 'user-123')
      
      expect(console.debug).not.toHaveBeenCalled()
    })
  })

  describe('message formatting', () => {
    it('should include timestamp in ISO format', () => {
      logger.warn('Test warning')
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/)
      )
    })

    it('should include log level in uppercase', () => {
      logger.error('Test error')
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      )
    })

    it('should handle messages without context', () => {
      logger.warn('Simple warning')
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Simple warning')
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.not.stringContaining('Context:')
      )
    })
  })

  describe('logger instance', () => {
    it('should have all required methods', () => {
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.userAction).toBe('function')
      expect(typeof logger.apiCall).toBe('function')
      expect(typeof logger.databaseQuery).toBe('function')
      expect(typeof logger.businessEvent).toBe('function')
    })
  })
})