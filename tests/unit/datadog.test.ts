import { afterEach, describe, expect, it, vi } from 'vitest'

const after = vi.fn()
vi.mock('next/server', () => ({ after }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
  after.mockReset()
})

async function loadLogger(env: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  return (await import('@/lib/datadog/server')).logger
}

describe('server logger', () => {
  it('writes to the console outside production', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const logger = await loadLogger({ DD_API_KEY: 'key' })
    logger.debug('a')
    logger.info('b', { x: 1 })
    logger.warn('c')
    logger.error('d')
    expect(info).toHaveBeenCalledWith('b', { x: 1 })
    expect(warn).toHaveBeenCalledWith('c', '')
    expect(error).toHaveBeenCalledWith('d', '')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stays on the console in production without an API key', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const logger = await loadLogger({ NODE_ENV: 'production', DD_API_KEY: '' })
    logger.warn('quiet')
    expect(warn).toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts to the Logs Intake API in production and keeps the request alive', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const logger = await loadLogger({
      NODE_ENV: 'production',
      DD_API_KEY: 'secret',
      DD_SITE: 'us5.datadoghq.com',
      DD_ENV: 'production',
    })
    logger.error('boom', { digest: 'abc' })
    expect(after).toHaveBeenCalledOnce()
    await after.mock.calls[0]![0]
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://http-intake.logs.us5.datadoghq.com/api/v2/logs')
    expect(new Headers(init.headers).get('DD-API-KEY')).toBe('secret')
    expect(JSON.parse(init.body as string)).toEqual([
      {
        message: 'boom',
        status: 'error',
        service: 'viewer-for-reddit',
        ddsource: 'nextjs',
        ddtags: 'env:production',
        digest: 'abc',
      },
    ])
  })

  it('never throws when delivery fails or there is no request to attach to', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('offline')
    })
    vi.stubGlobal('fetch', fetchMock)
    after.mockImplementation(() => {
      throw new Error('outside a request scope')
    })
    const logger = await loadLogger({ NODE_ENV: 'production', DD_API_KEY: 'secret' })
    expect(() => logger.info('still fine')).not.toThrow()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })
})

describe('onRequestError', () => {
  const request = { path: '/r/pics', method: 'GET', headers: {} }
  const context = {
    routerKind: 'App Router',
    routePath: '/r/[subreddit]',
    routeType: 'render',
    renderSource: 'react-server-components',
    revalidateReason: undefined,
  } as const

  it('logs the failure with its digest on the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs')
    const write = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onRequestError } = await import('@/instrumentation')
    await onRequestError(Object.assign(new Error('bad'), { digest: 'd1' }), request, context)
    expect(write).toHaveBeenCalledWith(
      'bad',
      expect.objectContaining({ digest: 'd1', request: { path: '/r/pics', method: 'GET' } }),
    )
    await onRequestError('plain', request, context)
    expect(write).toHaveBeenCalledWith('Unhandled request error', expect.anything())
  })

  it('does nothing on other runtimes', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge')
    const write = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onRequestError } = await import('@/instrumentation')
    await onRequestError(new Error('bad'), request, context)
    expect(write).not.toHaveBeenCalled()
  })
})
