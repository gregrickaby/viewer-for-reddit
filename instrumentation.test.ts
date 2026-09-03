import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/datadog/server', () => ({
  logger: {debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()}
}))

import {onRequestError} from '@/instrumentation'
import {logger} from '@/lib/datadog/server'

const request = {
  path: '/test',
  method: 'GET',
  headers: {}
} as const

const context = {
  routerKind: 'App Router',
  routePath: '/test',
  routeType: 'render',
  renderSource: undefined,
  revalidateReason: undefined
} as const

describe('onRequestError', () => {
  it('logs the message from a real Error instance without a digest', async () => {
    const error = new Error('boom')

    await onRequestError(error, request, context)

    expect(logger.error).toHaveBeenCalledWith('boom', {
      digest: undefined,
      request,
      context
    })
  })

  it('stringifies a non-Error thrown value', async () => {
    await onRequestError('a plain string error', request, context)

    expect(logger.error).toHaveBeenCalledWith('a plain string error', {
      digest: undefined,
      request,
      context
    })
  })

  it('extracts digest from an error-like object that has one', async () => {
    const error = Object.assign(new Error('with digest'), {
      digest: 'NEXT_REDIRECT'
    })

    await onRequestError(error, request, context)

    expect(logger.error).toHaveBeenCalledWith('with digest', {
      digest: 'NEXT_REDIRECT',
      request,
      context
    })
  })

  it('leaves digest undefined for an error-like object without one', async () => {
    const error = new TypeError('no digest here')

    await onRequestError(error, request, context)

    expect(logger.error).toHaveBeenCalledWith('no digest here', {
      digest: undefined,
      request,
      context
    })
  })
})
