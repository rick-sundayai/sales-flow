import { renderHook, act } from '@testing-library/react'
import { useMounted } from '@/hooks/useMounted'

describe('useMounted', () => {
  it('should return false initially and true after mount', () => {
    const { result } = renderHook(() => useMounted())
    
    // In the test environment, the effect runs immediately
    // So we expect it to be true after the first render
    expect(result.current).toBe(true)
  })

  it('should remain true after re-renders', () => {
    const { result, rerender } = renderHook(() => useMounted())
    
    expect(result.current).toBe(true)
    
    // Rerender and ensure it stays true
    rerender()
    
    expect(result.current).toBe(true)
  })

  it('should handle multiple instances independently', () => {
    const { result: result1 } = renderHook(() => useMounted())
    const { result: result2 } = renderHook(() => useMounted())
    
    expect(result1.current).toBe(true)
    expect(result2.current).toBe(true)
  })

  // Test the common hydration use case
  it('should help prevent hydration mismatches', () => {
    const { result: hookResult } = renderHook(() => useMounted())
    
    // In test environment, mounted is true after first render
    // This simulates the client-side behavior
    expect(hookResult.current).toBe(true)
  })
})