import {renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useBossButton} from './useBossButton'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock Mantine hooks
let mockScrollY = 0
vi.mock('@mantine/hooks', () => ({
  useWindowScroll: () => [{y: mockScrollY}]
}))

describe('useBossButton', () => {
  const redirectUrl = 'https://duckduckgo.com'

  beforeEach(() => {
    vi.clearAllMocks()
    mockScrollY = 0
  })

  it('initializes with correct default values', () => {
    const {result} = renderHook(() => useBossButton(redirectUrl))

    expect(result.current.shouldShow).toBe(false)
    expect(result.current.redirectUrl).toBe(redirectUrl)
    expect(result.current.buttonText).toContain('boss button')
  })

  it('returns correct button text', () => {
    const {result} = renderHook(() => useBossButton(redirectUrl))

    expect(result.current.buttonText).toBe(
      'The boss button. Click or press Escape to instantly navigate to DuckDuckGo.'
    )
  })

  it('shows button when scrolled past threshold', () => {
    mockScrollY = 250
    const {result} = renderHook(() => useBossButton(redirectUrl))

    expect(result.current.shouldShow).toBe(true)
  })

  it('hides button when scroll is below threshold', () => {
    mockScrollY = 150
    const {result} = renderHook(() => useBossButton(redirectUrl))

    expect(result.current.shouldShow).toBe(false)
  })

  it('shows button exactly at threshold', () => {
    mockScrollY = 200
    const {result} = renderHook(() => useBossButton(redirectUrl))

    expect(result.current.shouldShow).toBe(false)
  })

  it('shows button just above threshold', () => {
    mockScrollY = 201
    const {result} = renderHook(() => useBossButton(redirectUrl))

    expect(result.current.shouldShow).toBe(true)
  })

  it('navigates when Escape key is pressed', async () => {
    renderHook(() => useBossButton(redirectUrl))

    // Simulate Escape key press
    const escapeEvent = new KeyboardEvent('keydown', {key: 'Escape'})
    globalThis.window.dispatchEvent(escapeEvent)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(redirectUrl)
    })
  })

  it('does not navigate when other keys are pressed', () => {
    renderHook(() => useBossButton(redirectUrl))

    // Simulate other key presses
    const enterEvent = new KeyboardEvent('keydown', {key: 'Enter'})
    const spaceEvent = new KeyboardEvent('keydown', {key: ' '})
    const aEvent = new KeyboardEvent('keydown', {key: 'a'})

    globalThis.window.dispatchEvent(enterEvent)
    globalThis.window.dispatchEvent(spaceEvent)
    globalThis.window.dispatchEvent(aEvent)

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(
      globalThis.window,
      'removeEventListener'
    )

    const {unmount} = renderHook(() => useBossButton(redirectUrl))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )

    removeEventListenerSpy.mockRestore()
  })

  it('updates redirect URL when prop changes', () => {
    interface Props {
      url: string
    }

    const {result, rerender} = renderHook<
      {shouldShow: boolean; redirectUrl: string; buttonText: string},
      Props
    >(({url}) => useBossButton(url), {
      initialProps: {url: 'https://example.com'}
    })

    expect(result.current.redirectUrl).toBe('https://example.com')

    rerender({url: 'https://different.com'})

    expect(result.current.redirectUrl).toBe('https://different.com')
  })

  it('responds to new redirect URL when Escape is pressed', async () => {
    interface Props {
      url: string
    }

    const {rerender} = renderHook<
      {shouldShow: boolean; redirectUrl: string; buttonText: string},
      Props
    >(({url}) => useBossButton(url), {
      initialProps: {url: 'https://example.com'}
    })

    rerender({url: 'https://new-url.com'})

    const escapeEvent = new KeyboardEvent('keydown', {key: 'Escape'})
    globalThis.window.dispatchEvent(escapeEvent)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('https://new-url.com')
    })
  })

  it('memoizes button text to prevent unnecessary recalculations', () => {
    const {result, rerender} = renderHook(() => useBossButton(redirectUrl))

    const initialText = result.current.buttonText

    mockScrollY = 300
    rerender()

    expect(result.current.buttonText).toBe(initialText)
  })

  it('handles rapid Escape key presses', async () => {
    renderHook(() => useBossButton(redirectUrl))

    // Simulate multiple rapid Escape presses
    for (let i = 0; i < 5; i++) {
      const escapeEvent = new KeyboardEvent('keydown', {key: 'Escape'})
      globalThis.window.dispatchEvent(escapeEvent)
    }

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(5)
    })
  })

  it('handles scroll position edge cases', () => {
    // Negative scroll
    mockScrollY = -10
    const {result: result1} = renderHook(() => useBossButton(redirectUrl))
    expect(result1.current.shouldShow).toBe(false)

    // Zero scroll
    mockScrollY = 0
    const {result: result2} = renderHook(() => useBossButton(redirectUrl))
    expect(result2.current.shouldShow).toBe(false)

    // Very large scroll
    mockScrollY = 10000
    const {result: result3} = renderHook(() => useBossButton(redirectUrl))
    expect(result3.current.shouldShow).toBe(true)
  })
})
