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
 * Mock ResizeObserver.
 */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

/**
 * Mock IntersectionObserver.
 */
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}))
