import {setupBrowserMocks} from '@/test-utils/mocks/browserMocks'
import '@testing-library/jest-dom'
import {afterAll, afterEach, beforeAll} from 'vitest'
import {server} from './test-utils/msw/server'

setupBrowserMocks()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
