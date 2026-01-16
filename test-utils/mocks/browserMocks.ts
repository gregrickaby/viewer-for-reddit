import {vi} from 'vitest'

export function setupBrowserMocks() {
  // Mock window.matchMedia
  if (!globalThis.matchMedia) {
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })
  }

  // Mock ResizeObserver
  if (!globalThis.ResizeObserver) {
    class ResizeObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
    globalThis.ResizeObserver = ResizeObserver as any
  }

  // Mock scrollTo
  if (!globalThis.scrollTo) {
    globalThis.scrollTo = vi.fn()
  }

  // Mock IntersectionObserver
  if (!globalThis.IntersectionObserver) {
    class IntersectionObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      takeRecords = vi.fn().mockReturnValue([])
      root = null
      rootMargin = ''
      thresholds = []
    }
    globalThis.IntersectionObserver = IntersectionObserver as any
  }
}
