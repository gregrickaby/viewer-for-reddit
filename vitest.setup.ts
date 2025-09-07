import {setupBrowserMocks} from '@/test-utils/mocks/browserMocks'
import {server} from '@/test-utils/msw/server'
import '@testing-library/jest-dom'
import React from 'react'
import {URLSearchParams as NodeURLSearchParams} from 'url'
import {afterAll, afterEach, beforeAll, vi} from 'vitest'

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const {unoptimized, priority, ...rest} = props
    return React.createElement('img', rest)
  }
}))

// Polyfill: Vitest does not provide URLSearchParams in Node by default
// https://github.com/vitest-dev/vitest/issues/7906
global.URLSearchParams = NodeURLSearchParams as any

// Set up DOM-related browser APIs (e.g., matchMedia, ResizeObserver)
setupBrowserMocks()

// Global setup for Vitest test environment
beforeAll(() => {
  // Start the MSW server to intercept network requests
  server.listen({onUnhandledRequest: 'warn'})

  // Warn if any tests are not using the mocked API

  // Stub required environment variables for Reddit token fetching
  vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
  vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
})

afterEach(() => {
  // Reset any runtime request handlers between tests
  server.resetHandlers()
})

afterAll(() => {
  // Cleanly shut down MSW after all tests finish
  server.close()

  // Restore original environment variables
  vi.unstubAllEnvs()
})
