import {setupBrowserMocks} from '@/test-utils/mocks/browserMocks'
import '@testing-library/jest-dom'
import {URLSearchParams as NodeURLSearchParams} from 'url'
import {afterAll, afterEach, beforeAll} from 'vitest'
import {server} from './test-utils/msw/server'

// Polyfill for URLSearchParams in Node.js.
// https://github.com/vitest-dev/vitest/issues/7906
global.URLSearchParams = NodeURLSearchParams as any

setupBrowserMocks()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
