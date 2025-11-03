import {beforeEach, describe, expect, it, vi} from 'vitest'
import {DEFAULT_TIMEOUT_MS, fetchWithTimeout} from './fetchWithTimeout'

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully fetch with default timeout', async () => {
    const mockResponse = new Response('{"data": "test"}', {
      status: 200,
      headers: {'Content-Type': 'application/json'}
    })

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetchWithTimeout('https://api.example.com/test')

    expect(response.status).toBe(200)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        signal: expect.any(AbortSignal)
      })
    )
  })

  it('should pass through fetch options', async () => {
    const mockResponse = new Response('OK', {status: 200})
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const options: RequestInit = {
      method: 'POST',
      headers: {Authorization: 'Bearer token'},
      body: JSON.stringify({test: 'data'})
    }

    await fetchWithTimeout('https://api.example.com/test', options)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: {Authorization: 'Bearer token'},
        body: JSON.stringify({test: 'data'}),
        signal: expect.any(AbortSignal)
      })
    )
  })

  it('should use custom timeout', async () => {
    const mockResponse = new Response('OK', {status: 200})
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    await fetchWithTimeout('https://api.example.com/test', {}, 5000)

    // Successfully completes with custom timeout
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('should throw timeout error when request exceeds timeout', async () => {
    globalThis.fetch = vi.fn(() => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    })

    await expect(
      fetchWithTimeout('https://api.example.com/slow', {}, 100)
    ).rejects.toThrow(
      'Request to https://api.example.com/slow timed out after 100ms'
    )
  })

  it('should propagate non-timeout errors', async () => {
    const networkError = new Error('Network failure')
    globalThis.fetch = vi.fn().mockRejectedValue(networkError)

    await expect(
      fetchWithTimeout('https://api.example.com/test')
    ).rejects.toThrow('Network failure')
  })

  it('should use default timeout constant', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(10000)
  })

  it('should handle successful response with JSON data', async () => {
    const mockData = {name: 'testuser', id: '123'}
    const mockResponse = new Response(JSON.stringify(mockData), {
      status: 200,
      headers: {'Content-Type': 'application/json'}
    })

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetchWithTimeout('https://api.example.com/user')
    const data = await response.json()

    expect(data).toEqual(mockData)
  })

  it('should handle non-OK HTTP responses', async () => {
    const mockResponse = new Response('Not Found', {status: 404})
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetchWithTimeout('https://api.example.com/missing')

    expect(response.status).toBe(404)
  })

  it('should clear timeout on successful completion', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const mockResponse = new Response('OK', {status: 200})
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    await fetchWithTimeout('https://api.example.com/test')

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should clear timeout on error', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    try {
      await fetchWithTimeout('https://api.example.com/test')
    } catch {
      // Expected error
    }

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should handle empty response bodies', async () => {
    const mockResponse = new Response(null, {status: 204})
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await fetchWithTimeout('https://api.example.com/delete')

    expect(response.status).toBe(204)
  })
})
