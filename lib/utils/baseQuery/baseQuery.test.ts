import {beforeEach, describe, expect, it, vi} from 'vitest'

// Hoist env stubs to run before module imports
vi.hoisted(() => {
  process.env.AUTH_URL = 'http://localhost:3000'
  process.env.USER_AGENT = 'test-user-agent'
  process.env.SESSION_DOMAIN = ''
})

import {baseQuery} from './baseQuery'

// Mock fetchBaseQuery to avoid actual network requests
vi.mock('@reduxjs/toolkit/query/react', () => ({
  fetchBaseQuery: vi.fn(() => vi.fn())
}))

describe('baseQuery', () => {
  const mockApi = {
    dispatch: vi.fn(),
    getState: vi.fn(),
    extra: undefined,
    requestId: 'test-request-id',
    signal: new AbortController().signal,
    abort: vi.fn(),
    getCacheEntry: vi.fn(),
    updateCachedData: vi.fn(),
    endpoint: 'test-endpoint',
    type: 'query' as const
  }

  const mockExtraOptions = {}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('URL construction', () => {
    it('should construct proxy URL with string args', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      const args = '/r/programming/hot.json'
      await baseQuery(args, mockApi, mockExtraOptions)

      expect(mockProxyQuery).toHaveBeenCalledWith(
        `?path=${encodeURIComponent('/r/programming/hot.json')}`,
        mockApi,
        mockExtraOptions
      )
    })

    it('should construct proxy URL with object args', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      const args = {
        url: '/r/programming/hot.json',
        method: 'GET' as const
      }
      await baseQuery(args, mockApi, mockExtraOptions)

      expect(mockProxyQuery).toHaveBeenCalledWith(
        {
          url: `?path=${encodeURIComponent('/r/programming/hot.json')}`,
          method: 'GET'
        },
        mockApi,
        mockExtraOptions
      )
    })

    it('should handle URL encoding for special characters', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      const args = '/r/programming+webdev/hot.json?limit=25&after=t3_abc123'
      await baseQuery(args, mockApi, mockExtraOptions)

      expect(mockProxyQuery).toHaveBeenCalledWith(
        `?path=${encodeURIComponent('/r/programming+webdev/hot.json?limit=25&after=t3_abc123')}`,
        mockApi,
        mockExtraOptions
      )
    })
  })

  describe('environment handling', () => {
    it('should use localhost URL in test environment', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      // Mock test environment
      vi.stubEnv('NODE_ENV', 'test')

      await baseQuery('/test', mockApi, mockExtraOptions)

      expect(fetchBaseQuery).toHaveBeenCalledWith({
        baseUrl: 'http://localhost:3000/api/reddit',
        prepareHeaders: expect.any(Function)
      })

      vi.unstubAllEnvs()
    })

    it('should use relative URL in browser environment', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      // Mock browser environment
      const originalWindow = global.window
      global.window = {} as any
      vi.stubEnv('NODE_ENV', 'development')

      await baseQuery('/test', mockApi, mockExtraOptions)

      expect(fetchBaseQuery).toHaveBeenCalledWith({
        baseUrl: '/api/reddit',
        prepareHeaders: expect.any(Function)
      })

      global.window = originalWindow
      vi.unstubAllEnvs()
    })
  })

  describe('headers configuration', () => {
    it('should set Content-Type header to application/json', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      await baseQuery('/test', mockApi, mockExtraOptions)

      const [config] = (fetchBaseQuery as any).mock.calls[0]
      const mockHeaders = new Headers()
      const prepareHeaders = config.prepareHeaders

      const result = prepareHeaders(mockHeaders)

      expect(result.get('Content-Type')).toBe('application/json')
    })

    it('should preserve existing headers when setting Content-Type', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      await baseQuery('/test', mockApi, mockExtraOptions)

      const [config] = (fetchBaseQuery as any).mock.calls[0]
      const mockHeaders = new Headers()
      mockHeaders.set('Authorization', 'Bearer token123')
      const prepareHeaders = config.prepareHeaders

      const result = prepareHeaders(mockHeaders)

      expect(result.get('Content-Type')).toBe('application/json')
      expect(result.get('Authorization')).toBe('Bearer token123')
    })
  })

  describe('error handling', () => {
    it('should pass through proxy query results', async () => {
      const expectedResult = {data: 'success', error: undefined}
      const mockProxyQuery = vi.fn().mockResolvedValue(expectedResult)
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      const result = await baseQuery('/test', mockApi, mockExtraOptions)

      expect(result).toEqual(expectedResult)
    })

    it('should pass through proxy query errors', async () => {
      const expectedError = {error: {status: 500, data: 'Server Error'}}
      const mockProxyQuery = vi.fn().mockResolvedValue(expectedError)
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      const result = await baseQuery('/test', mockApi, mockExtraOptions)

      expect(result).toEqual(expectedError)
    })

    it('should handle proxy query rejections', async () => {
      const expectedError = new Error('Network failure')
      const mockProxyQuery = vi.fn().mockRejectedValue(expectedError)
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      await expect(
        baseQuery('/test', mockApi, mockExtraOptions)
      ).rejects.toThrow('Network failure')
    })
  })

  describe('extraOptions handling', () => {
    it('should pass through extraOptions to proxy query', async () => {
      const mockProxyQuery = vi.fn().mockResolvedValue({data: 'test'})
      const {fetchBaseQuery} = await import('@reduxjs/toolkit/query/react')
      ;(fetchBaseQuery as any).mockReturnValue(mockProxyQuery)

      const customExtraOptions = {customOption: 'value'}
      await baseQuery('/test', mockApi, customExtraOptions)

      expect(mockProxyQuery).toHaveBeenCalledWith(
        expect.any(String),
        mockApi,
        customExtraOptions
      )
    })
  })
})
