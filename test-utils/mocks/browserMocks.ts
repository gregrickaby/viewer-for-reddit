import {vi} from 'vitest'

export function setupBrowserMocks() {
  // Mock window.matchMedia
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
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
  if (!window.ResizeObserver) {
    class ResizeObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
    window.ResizeObserver = ResizeObserver as any
  }

  // Mock scrollTo
  if (!window.scrollTo) {
    window.scrollTo = vi.fn()
  }

  // Mock IntersectionObserver
  if (!window.IntersectionObserver) {
    class IntersectionObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      takeRecords = vi.fn().mockReturnValue([])
      root = null
      rootMargin = ''
      thresholds = []
    }
    window.IntersectionObserver = IntersectionObserver as any
  }
}
