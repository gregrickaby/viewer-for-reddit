import {vi} from 'vitest'

export const createAxiomRouteHandler = vi.fn(() => vi.fn())
export const createProxyRouteHandler = vi.fn(() => vi.fn())
export const nextJsFormatters = []
export const transformMiddlewareRequest = vi.fn(() => ({}))
export const withAxiom = vi.fn((fn: unknown) => fn)
