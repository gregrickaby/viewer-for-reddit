import {datadogLogs, type LogsEvent} from '@datadog/browser-logs'
import {datadogRum, type RumEvent} from '@datadog/browser-rum'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('instrumentation-client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes Datadog RUM and Logs on import', async () => {
    await import('@/instrumentation-client')

    expect(datadogRum.init).toHaveBeenCalledTimes(1)
    expect(datadogLogs.init).toHaveBeenCalledTimes(1)
  })

  describe('RUM beforeSend', () => {
    async function getRumBeforeSend() {
      await import('@/instrumentation-client')
      const initCall = vi.mocked(datadogRum.init).mock.calls[0][0]
      return initCall.beforeSend as (event: RumEvent) => boolean
    }

    it('drops a cancelled RSC prefetch error event', async () => {
      const beforeSend = await getRumBeforeSend()

      const event = {
        type: 'error',
        error: {
          resource: {
            status_code: 0,
            url: 'https://example.com/page?_rsc=abc123'
          }
        }
      } as unknown as RumEvent

      expect(beforeSend(event)).toBe(false)
    })

    it('keeps a real error event', async () => {
      const beforeSend = await getRumBeforeSend()

      const event = {
        type: 'error',
        error: {
          resource: {status_code: 500, url: 'https://example.com/page'}
        }
      } as unknown as RumEvent

      expect(beforeSend(event)).toBe(true)
    })

    it('keeps non-error events even when the resource looks cancelled', async () => {
      const beforeSend = await getRumBeforeSend()

      const event = {
        type: 'action',
        error: {
          resource: {
            status_code: 0,
            url: 'https://example.com/page?_rsc=abc123'
          }
        }
      } as unknown as RumEvent

      expect(beforeSend(event)).toBe(true)
    })

    it('keeps a status_code 0 error event with no resource url', async () => {
      const beforeSend = await getRumBeforeSend()

      const event = {
        type: 'error',
        error: {resource: {status_code: 0, url: undefined}}
      } as unknown as RumEvent

      expect(beforeSend(event)).toBe(true)
    })
  })

  describe('Logs beforeSend', () => {
    async function getLogsBeforeSend() {
      await import('@/instrumentation-client')
      const initCall = vi.mocked(datadogLogs.init).mock.calls[0][0]
      return initCall.beforeSend as (log: LogsEvent) => boolean
    }

    it('drops a cancelled RSC prefetch error log', async () => {
      const beforeSend = await getLogsBeforeSend()

      const log = {
        status: 'error',
        http: {status_code: 0, url: 'https://example.com/page?_rsc=abc123'}
      } as unknown as LogsEvent

      expect(beforeSend(log)).toBe(false)
    })

    it('keeps a real error log', async () => {
      const beforeSend = await getLogsBeforeSend()

      const log = {
        status: 'error',
        http: {status_code: 500, url: 'https://example.com/page'}
      } as unknown as LogsEvent

      expect(beforeSend(log)).toBe(true)
    })

    it('keeps non-error logs even when the request looks cancelled', async () => {
      const beforeSend = await getLogsBeforeSend()

      const log = {
        status: 'info',
        http: {status_code: 0, url: 'https://example.com/page?_rsc=abc123'}
      } as unknown as LogsEvent

      expect(beforeSend(log)).toBe(true)
    })

    it('keeps a status_code 0 error log with no request url', async () => {
      const beforeSend = await getLogsBeforeSend()

      const log = {
        status: 'error',
        http: {status_code: 0, url: undefined}
      } as unknown as LogsEvent

      expect(beforeSend(log)).toBe(true)
    })
  })
})
