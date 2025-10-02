import {beforeEach, describe, expect, it, vi} from 'vitest'
import {GET} from './route'

// Mock session module
vi.mock('@/lib/auth/session', () => ({
  getClientSession: vi.fn()
}))

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return client session when user is authenticated', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    const mockSession = {
      username: 'testuser',
      expiresAt: Date.now() + 3600000,
      isAuthenticated: true,
      avatarUrl: 'https://example.com/avatar.png'
    }
    vi.mocked(getClientSession).mockResolvedValue(mockSession)

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual(mockSession)
  })

  it('should return null when no session exists', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    vi.mocked(getClientSession).mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toBeNull()
  })

  it('should not include tokens in response', async () => {
    const {getClientSession} = await import('@/lib/auth/session')
    const mockSession = {
      username: 'testuser',
      expiresAt: Date.now() + 3600000,
      isAuthenticated: true,
      avatarUrl: 'https://example.com/avatar.png'
    }
    vi.mocked(getClientSession).mockResolvedValue(mockSession)

    const response = await GET()

    const data = await response.json()
    expect(data).not.toHaveProperty('accessToken')
    expect(data).not.toHaveProperty('refreshToken')
  })
})
