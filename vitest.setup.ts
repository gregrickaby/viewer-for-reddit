import {installDomShims, removeDomShims} from '@/test-utils/domShims'
import {setupBrowserMocks} from '@/test-utils/mocks/browserMocks'
import {server} from '@/test-utils/msw/server'
import '@testing-library/jest-dom'
import {toHaveNoViolations} from 'jest-axe'
import type {StaticImageData} from 'next/image'
import {URLSearchParams as NodeURLSearchParams} from 'node:url'
import React, {type ImgHTMLAttributes} from 'react'
import {afterAll, afterEach, beforeAll, vi} from 'vitest'

expect.extend(toHaveNoViolations)

interface MockNextImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> {
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

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}))

// Polyfill: Vitest does not provide URLSearchParams in Node by default
// https://github.com/vitest-dev/vitest/issues/7906
globalThis.URLSearchParams = NodeURLSearchParams as any

// Set up base URL for test environment
if (globalThis.window !== undefined) {
  Object.defineProperty(globalThis.window, 'location', {
    value: {
      ...globalThis.window.location,
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
      href: 'http://localhost:3000'
    },
    writable: true
  })
}

// Set up DOM-related browser APIs
if (globalThis.window !== undefined) {
  setupBrowserMocks()
}

// Global setup for Vitest test environment
beforeAll(() => {
  server.listen({onUnhandledRequest: 'warn'})

  if (globalThis.window !== undefined) {
    installDomShims()
  }

  vi.stubEnv('APP_URL', 'http://localhost:3000')
  vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
  vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
  vi.stubEnv('SESSION_SECRET', 'test-session-secret-at-least-32-chars-long')
  vi.stubEnv('USER_AGENT', 'test-user-agent')

  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()

  if (globalThis.window !== undefined) {
    removeDomShims()
  }

  vi.unstubAllEnvs()
})
