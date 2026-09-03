import {render} from '@/test-utils'
import type {ReactElement} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import RouteScrollReset from './RouteScrollReset'

const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname()
}))

describe('RouteScrollReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
    globalThis.sessionStorage.clear()

    globalThis.history.replaceState({}, '', '/')
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined)
  })

  it('disables the browser automatic scroll restoration so it cannot race the manual restore', () => {
    globalThis.history.scrollRestoration = 'auto'

    render(<RouteScrollReset />)

    expect(globalThis.history.scrollRestoration).toBe('manual')
  })

  it('scrolls to top on mount', () => {
    render(<RouteScrollReset />)

    expect(globalThis.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto'
    })
  })

  it('scrolls to top when pathname changes', () => {
    const {rerender} = render(<RouteScrollReset />)

    mockUsePathname.mockReturnValue('/r/javascript')
    rerender(<RouteScrollReset />)

    expect(globalThis.scrollTo).toHaveBeenCalledTimes(2)
  })

  it('does not scroll again when pathname is unchanged', () => {
    const {rerender} = render(<RouteScrollReset />)

    rerender(<RouteScrollReset />)

    expect(globalThis.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('restores saved scroll position on popstate navigation', () => {
    const {rerender} = render(<RouteScrollReset />)

    Object.defineProperty(globalThis, 'scrollY', {
      value: 1875,
      writable: true,
      configurable: true
    })
    globalThis.dispatchEvent(new Event('scroll'))

    mockUsePathname.mockReturnValue('/r/typescript')
    rerender(<RouteScrollReset />)

    globalThis.dispatchEvent(new PopStateEvent('popstate'))

    mockUsePathname.mockReturnValue('/')
    rerender(<RouteScrollReset />)

    expect(globalThis.scrollTo).toHaveBeenLastCalledWith({
      top: 1875,
      left: 0,
      behavior: 'auto'
    })
  })

  describe('settling after a popstate restore', () => {
    let observedMutationCallback: (() => void) | null = null
    const originalMutationObserver = globalThis.MutationObserver

    class MockMutationObserver {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(callback: () => void) {
        observedMutationCallback = callback
      }
    }

    beforeEach(() => {
      vi.useFakeTimers()
      observedMutationCallback = null
      globalThis.MutationObserver =
        MockMutationObserver as unknown as typeof MutationObserver
    })

    afterEach(() => {
      vi.useRealTimers()
      globalThis.MutationObserver = originalMutationObserver
    })

    /** Simulates the MutationObserver reporting a batch of DOM changes. */
    function simulateMutation() {
      observedMutationCallback?.()
    }

    /** Drives RouteScrollReset through a forward nav + popstate back to '/' with a saved position. */
    function triggerPopStateRestore(rerender: (ui: ReactElement) => void) {
      Object.defineProperty(globalThis, 'scrollY', {
        value: 1200,
        writable: true,
        configurable: true
      })
      globalThis.dispatchEvent(new Event('scroll'))

      mockUsePathname.mockReturnValue('/r/typescript')
      rerender(<RouteScrollReset />)

      globalThis.dispatchEvent(new PopStateEvent('popstate'))

      mockUsePathname.mockReturnValue('/')
      rerender(<RouteScrollReset />)
    }

    it('reasserts the restored position once mutations from streamed-in content quiet down', () => {
      const {rerender} = render(<RouteScrollReset />)
      triggerPopStateRestore(rerender)

      const callsAfterInitialRestore = vi.mocked(globalThis.scrollTo).mock.calls
        .length

      // Content is still streaming in (dynamic segment resolving) -- keep
      // pushing the quiet window out.
      simulateMutation()
      vi.advanceTimersByTime(100)
      expect(globalThis.scrollTo).toHaveBeenCalledTimes(
        callsAfterInitialRestore
      )

      simulateMutation()
      vi.advanceTimersByTime(100)
      expect(globalThis.scrollTo).toHaveBeenCalledTimes(
        callsAfterInitialRestore
      )

      // No further mutations -- the quiet window elapses and we reassert.
      vi.advanceTimersByTime(150)
      expect(globalThis.scrollTo).toHaveBeenCalledTimes(
        callsAfterInitialRestore + 1
      )
      expect(globalThis.scrollTo).toHaveBeenLastCalledWith({
        top: 1200,
        left: 0,
        behavior: 'auto'
      })
    })

    it('stops waiting for content to settle after the max wait elapses, even with continuous mutations', () => {
      const {rerender} = render(<RouteScrollReset />)
      triggerPopStateRestore(rerender)

      const callsAfterInitialRestore = vi.mocked(globalThis.scrollTo).mock.calls
        .length

      // Simulate a chatty page that never goes quiet for a full 150ms.
      for (let elapsed = 0; elapsed < 2500; elapsed += 100) {
        simulateMutation()
        vi.advanceTimersByTime(100)
      }

      expect(globalThis.scrollTo).toHaveBeenCalledTimes(
        callsAfterInitialRestore + 1
      )
      expect(globalThis.scrollTo).toHaveBeenLastCalledWith({
        top: 1200,
        left: 0,
        behavior: 'auto'
      })
    })
  })

  it('does not clobber a scrolled page position when navigating away', () => {
    const {rerender} = render(<RouteScrollReset />)

    Object.defineProperty(globalThis, 'scrollY', {
      value: 3200,
      writable: true,
      configurable: true
    })
    globalThis.dispatchEvent(new Event('scroll'))

    // Next.js's own scroll-to-top handling (a `useLayoutEffect`) runs before
    // this component's passive-effect cleanup, so by the time cleanup reads
    // `scrollY` for the outgoing page, the browser has already jumped to 0
    // for the incoming page.
    Object.defineProperty(globalThis, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true
    })

    mockUsePathname.mockReturnValue('/r/typescript')
    rerender(<RouteScrollReset />)

    expect(globalThis.sessionStorage.getItem('scroll-position:/')).toBe('3200')
  })
})
