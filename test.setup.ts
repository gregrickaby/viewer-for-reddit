import '@testing-library/jest-dom'
import {afterAll, afterEach, beforeAll} from 'vitest'
import {server} from './__tests__/msw/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
