/**
 * Simple test to verify Jest setup is working correctly
 */

describe('Basic Jest functionality', () => {
  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect([1, 2, 3]).toHaveLength(3)
  })

  it('should support async tests', async () => {
    const promise = Promise.resolve('success')
    await expect(promise).resolves.toBe('success')
  })

  it('should support mocking', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('should have access to Jest matchers', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj).toEqual({ name: 'test', value: 42 })
    expect(obj).toHaveProperty('name')
    expect(obj.name).toMatch(/test/)
  })
})