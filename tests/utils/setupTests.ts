import '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom/vitest'
import { server } from './server'

/**
 * Before all tests, start the MSW server.
 */
beforeAll(() => {
  server.listen()
})

/**
 * After each test, reset the MSW server to its default handlers.
 */
afterEach(() => {
  server.resetHandlers()
})

/**
 * After all tests, stop the MSW server.
 */
afterAll(() => {
  server.close()
})

/**
 * Mock window.matchMedia.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

/**
 * Mock IntersectionObserver.
 */
global.IntersectionObserver = class IntersectionObserver
  implements IntersectionObserver
{
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe: (target: Element) => void
  unobserve: (target: Element) => void
  disconnect: () => void

  constructor() {
    this.observe = vi.fn()
    this.unobserve = vi.fn()
    this.disconnect = vi.fn()
  }
} as unknown as typeof IntersectionObserver
