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

// Set up base URL for test environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
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
if (typeof window !== 'undefined') {
  setupBrowserMocks()
}

// Global setup for Vitest test environment
beforeAll(() => {
  server.listen({onUnhandledRequest: 'warn'})

  if (typeof window !== 'undefined') {
    installDomShims()
  }

  vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
  vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
  vi.stubEnv('SESSION_SECRET', 'test-session-secret-at-least-32-chars-long')
  vi.stubEnv('AUTH_URL', 'http://localhost:3000')
  vi.stubEnv('USER_AGENT', 'test-user-agent')
  vi.stubEnv('SESSION_DOMAIN', '') // Empty string for localhost-only in tests

  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  server.resetHandlers()
  // Note: Don't unstub env vars here - required config values need to persist
})

afterAll(() => {
  server.close()

  if (typeof window !== 'undefined') {
    removeDomShims()
  }

  vi.unstubAllEnvs()
})
