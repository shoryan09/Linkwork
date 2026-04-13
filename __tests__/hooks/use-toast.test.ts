import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/use-toast'

describe('useToast', () => {
  it('should provide toast function', () => {
    const { result } = renderHook(() => useToast())
    
    expect(typeof result.current.toast).toBe('function')
    expect(typeof result.current.dismiss).toBe('function')
  })

  it('should add toast when toast function is called', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test toast',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      description: 'This is a test toast',
    })
  })

  it('should generate unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
    })

    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id)
  })

  it('should dismiss toast by ID', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string

    act(() => {
      result.current.toast({ title: 'Test Toast' })
      toastId = result.current.toasts[0].id
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(toastId)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should dismiss all toasts when no ID provided', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })

    expect(result.current.toasts).toHaveLength(3)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should auto-dismiss toasts after duration', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Auto-dismiss Toast',
        duration: 1000,
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.toasts).toHaveLength(0)

    jest.useRealTimers()
  })

  it('should not auto-dismiss when duration is Infinity', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Persistent Toast',
        duration: Infinity,
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    // Fast-forward time by a lot
    act(() => {
      jest.advanceTimersByTime(10000)
    })

    expect(result.current.toasts).toHaveLength(1)

    jest.useRealTimers()
  })

  it('should handle toast variants', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Error Toast',
        variant: 'destructive',
      })
    })

    expect(result.current.toasts[0].variant).toBe('destructive')
  })

  it('should handle toast actions', () => {
    const { result } = renderHook(() => useToast())
    const mockAction = {
      label: 'Undo',
      onClick: jest.fn(),
    }

    act(() => {
      result.current.toast({
        title: 'Toast with Action',
        action: mockAction,
      })
    })

    expect(result.current.toasts[0].action).toBe(mockAction)
  })
})