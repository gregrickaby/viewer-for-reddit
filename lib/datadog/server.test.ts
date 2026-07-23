import {http, HttpResponse, server} from '@/test-utils'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {logger} from './server'

const LOGS_URL = 'https://http-intake.logs.datadoghq.com/api/v2/logs'

describe('datadog server logger', () => {
  afterEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
  })

  describe('development (non-production)', () => {
    it('logs info via console.info', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      logger.info('hello', {a: 1})
      expect(spy).toHaveBeenCalledWith('hello', {a: 1})
    })

    it('logs debug via console.info', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const {debug: debugLog} = logger
      debugLog('debugging')
      expect(spy).toHaveBeenCalledWith('debugging', '')
    })

    it('logs warn via console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logger.warn('careful', {b: 2})
      expect(spy).toHaveBeenCalledWith('careful', {b: 2})
    })

    it('logs error via console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.error('broken', {c: 3})
      expect(spy).toHaveBeenCalledWith('broken', {c: 3})
    })

    it('does not call fetch', async () => {
      const fetchSpy = vi.fn()
      server.use(
        http.post(LOGS_URL, () => {
          fetchSpy()
          return HttpResponse.json({success: true})
        })
      )

      await logger.info('no network call')

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('production', () => {
    it('POSTs a structured log entry to the Datadog Logs Intake API', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      let capturedBody: unknown
      let capturedApiKey: string | null = null
      server.use(
        http.post(LOGS_URL, async ({request}) => {
          capturedBody = await request.json()
          capturedApiKey = request.headers.get('DD-API-KEY')
          return HttpResponse.json({success: true})
        })
      )

      await logger.error('Something broke', {resource: 'r/popular'})

      expect(capturedApiKey).toBe('test-dd-api-key')
      expect(capturedBody).toEqual([
        expect.objectContaining({
          message: 'Something broke',
          level: 'error',
          service: 'reddit-viewer',
          ddsource: 'nextjs',
          resource: 'r/popular'
        })
      ])
    })

    it('swallows delivery failures instead of throwing', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      server.use(
        http.post(LOGS_URL, () => {
          return HttpResponse.error()
        })
      )

      await expect(
        logger.error('will fail to deliver')
      ).resolves.toBeUndefined()
    })
  })
})
