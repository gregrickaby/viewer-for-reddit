import { handlers } from '@/__tests__/mocks/handlers'
import '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'

// Export everything.
export * from '@testing-library/react'
export * from '@testing-library/user-event'

// Export custom render function.
export { customRender as render } from '@/__tests__/mocks/customRender'

/**
 * Create a new MSW server with the defined handlers.
 *
 * @see https://mswjs.io/docs/getting-started/integrate/node
 */
export const server = setupServer(...handlers)

/**
 * Before all tests, start the MSW server.
 */
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'bypass'
  })

  // Suppress console errors produced by logError().
  vi.spyOn(console, 'error').mockImplementation(() => {})
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
