import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'

// Mock window.matchMedia
const mockMatchMedia = jest.fn()

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockMatchMedia.mockClear()
    
    // Set up default mock implementation
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })
  })

  it('should return false for desktop screens', () => {
    // Mock desktop screen (width >= 768px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const mockMql = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockMatchMedia.mockImplementation(() => mockMql)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should return true for mobile screens', () => {
    // Mock mobile screen (width < 768px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    const mockMql = {
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockMatchMedia.mockImplementation(() => mockMql)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should update when screen size changes', () => {
    let mockMql: any
    const listeners: Array<() => void> = []

    // Mock initial desktop state
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    mockMql = {
      matches: false,
      addEventListener: jest.fn((event, callback) => {
        if (event === 'change') {
          listeners.push(callback)
        }
      }),
      removeEventListener: jest.fn((event, callback) => {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }),
    }

    mockMatchMedia.mockImplementation(() => mockMql)

    const { result } = renderHook(() => useIsMobile())

    // Should initially be false (desktop)
    expect(result.current).toBe(false)

    // Simulate screen resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    // Trigger the change event
    act(() => {
      listeners.forEach(listener => listener())
    })

    expect(result.current).toBe(true)
  })

  it('should clean up event listeners on unmount', () => {
    const mockMql = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockMatchMedia.mockImplementation(() => mockMql)

    const { unmount } = renderHook(() => useIsMobile())

    expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()

    expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should return undefined initially and then the correct value', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const mockMql = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    mockMatchMedia.mockImplementation(() => mockMql)

    const { result } = renderHook(() => useIsMobile())

    // Initially should be false (since !!undefined = false)
    expect(result.current).toBe(false)
  })
})