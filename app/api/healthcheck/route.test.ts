import {describe, expect, it, beforeEach, vi} from 'vitest'
import {GET} from './route'

describe('GET /api/healthcheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 status', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
  })

  it('returns ok status in response body', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('ok')
  })

  it('includes timestamp in response', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.timestamp).toBeDefined()
    expect(typeof data.timestamp).toBe('string')
    // Verify it's a valid ISO date string
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
  })

  it('includes service name in response', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.service).toBe('viewer-for-reddit')
  })

  it('sets Cache-Control header to prevent caching', async () => {
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe(
      'no-store, no-cache, must-revalidate'
    )
  })

  it('sets Content-Type header to application/json', async () => {
    const response = await GET()

    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('response timestamp is recent', async () => {
    const before = new Date()
    const response = await GET()
    const after = new Date()
    const data = await response.json()

    const timestamp = new Date(data.timestamp)
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})
