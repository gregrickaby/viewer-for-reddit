import {installDomShims, removeDomShims} from '@/test-utils/domShims'
import {setupBrowserMocks} from '@/test-utils/mocks/browserMocks'
import {server} from '@/test-utils/msw/server'
import '@testing-library/jest-dom'
import type {StaticImageData} from 'next/image'
import React, {type ImgHTMLAttributes} from 'react'
import {URLSearchParams as NodeURLSearchParams} from 'url'
import {afterAll, afterEach, beforeAll, vi} from 'vitest'

interface MockNextImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | StaticImageData
  alt: string
  priority?: boolean
  unoptimized?: boolean
}

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({src, alt, priority, unoptimized, ...rest}: MockNextImageProps) => {
    const imgSrc = typeof src === 'string' ? src : src.src
    return React.createElement('img', {...rest, src: imgSrc, alt})
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

  // Install test DOM shims
  installDomShims()

  // Stub required environment variables for Reddit token fetching
  vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
  vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')

  // Spy on console methods to suppress logs during tests
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  // Reset any runtime request handlers between tests
  server.resetHandlers()
})

afterAll(() => {
  // Cleanly shut down MSW after all tests finish
  server.close()

  // Remove any test DOM shims
  removeDomShims()

  // Restore original environment variables
  vi.unstubAllEnvs()
})
