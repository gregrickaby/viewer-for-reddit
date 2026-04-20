/// <reference types="vitest/globals" />

/**
 * Shared IntersectionObserver mock registered globally in Vitest setup.
 *
 * Import `mockObserver` in any test file and call `mockObserver._trigger(true)`
 * to simulate an intersection event. State is reset between each test.
 */
export const mockObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  _callback: null as IntersectionObserverCallback | null,

  /**
   * Simulate an intersection event.
   *
   * @param isIntersecting - Whether the sentinel element is intersecting.
   */
  _trigger(isIntersecting: boolean): void {
    mockObserver._callback?.(
      [{isIntersecting} as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  }
}

global.IntersectionObserver = class {
  constructor(cb: IntersectionObserverCallback) {
    mockObserver._callback = cb
  }
  observe = mockObserver.observe
  unobserve = mockObserver.unobserve
  disconnect = mockObserver.disconnect
} as unknown as typeof IntersectionObserver

beforeEach(() => {
  mockObserver.observe.mockClear()
  mockObserver.unobserve.mockClear()
  mockObserver.disconnect.mockClear()
  mockObserver._callback = null
})
