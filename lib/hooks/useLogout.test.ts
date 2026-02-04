import {logout} from '@/lib/actions/auth'
import {act, renderHook, waitFor} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useLogout} from './useLogout'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

vi.mock('@/lib/actions/auth', () => ({
  logout: vi.fn(async () => ({success: true}))
}))

const mockUseRouter = vi.mocked(useRouter)
const mockLogout = vi.mocked(logout)

describe('useLogout', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogout.mockResolvedValue({success: true})
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      replace: vi.fn()
    } as any)
  })

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useLogout())

    expect(result.current.isLoggingOut).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(typeof result.current.handleLogout).toBe('function')
  })

  it('calls logout action when handleLogout is invoked', async () => {
    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('sets isLoggingOut to true during logout', async () => {
    let resolveFn: (value: any) => void
    mockLogout.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve
        })
    )

    const {result} = renderHook(() => useLogout())

    act(() => {
      result.current.handleLogout()
    })

    // Should be logging out immediately
    expect(result.current.isLoggingOut).toBe(true)

    // Resolve the logout
    await act(async () => {
      resolveFn!({success: true})
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })
  })

  it('resets isLoggingOut after successful logout', async () => {
    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })
  })

  it('navigates to home page after successful logout', async () => {
    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('refreshes router after successful logout', async () => {
    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await vi.waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('prevents race conditions by ignoring calls while isPending', async () => {
    let resolveFn: (value: any) => void
    mockLogout.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve
        })
    )

    const {result} = renderHook(() => useLogout())

    // Start first logout
    act(() => {
      result.current.handleLogout()
    })

    expect(result.current.isPending).toBe(true)

    // Try to logout again while pending (should be ignored)
    await act(async () => {
      await result.current.handleLogout()
    })

    // Resolve the first logout
    await act(async () => {
      resolveFn!({success: true})
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // Should only have been called once
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('prevents race conditions by ignoring calls while isLoggingOut', async () => {
    let resolveFn: (value: any) => void
    mockLogout.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve
        })
    )

    const {result} = renderHook(() => useLogout())

    // Start first logout
    act(() => {
      result.current.handleLogout()
    })

    expect(result.current.isLoggingOut).toBe(true)

    // Try to logout again while logging out (should be ignored)
    await act(async () => {
      await result.current.handleLogout()
    })

    // Resolve the first logout
    await act(async () => {
      resolveFn!({success: true})
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })

    // Should only have been called once
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('handles failed logout without navigation', async () => {
    mockLogout.mockResolvedValueOnce({success: false, error: 'Logout failed'})

    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })

    // Should not navigate on failure
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('resets isLoggingOut after failed logout', async () => {
    mockLogout.mockResolvedValueOnce({success: false, error: 'Logout failed'})

    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })
  })

  it('handles network errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLogout.mockRejectedValueOnce(new Error('Network error'))

    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })

    // Component should not throw, just log the error
    expect(result.current.isLoggingOut).toBe(false)

    consoleSpy.mockRestore()
  })

  it('resets isLoggingOut after network error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLogout.mockRejectedValueOnce(new Error('Network error'))

    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })

    consoleSpy.mockRestore()
  })

  it('does not navigate after network error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLogout.mockRejectedValueOnce(new Error('Network error'))

    const {result} = renderHook(() => useLogout())

    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })

    expect(mockPush).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('handles multiple successful logouts in sequence', async () => {
    const {result} = renderHook(() => useLogout())

    // First logout
    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/')

    // Reset mocks
    mockLogout.mockClear()
    mockPush.mockClear()
    mockRefresh.mockClear()

    // Second logout
    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
    })

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('allows logout after previous logout completes', async () => {
    const {result} = renderHook(() => useLogout())

    // First logout
    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false)
      expect(result.current.isPending).toBe(false)
    })

    // Clear mocks
    mockLogout.mockClear()

    // Second logout should work
    await act(async () => {
      await result.current.handleLogout()
    })

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })
})
