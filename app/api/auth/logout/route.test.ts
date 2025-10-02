import {beforeEach, describe, expect, it, vi} from 'vitest'
import {POST} from './route'

// Mock session module
vi.mock('@/lib/auth/session', () => ({
  deleteSession: vi.fn()
}))

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete session and return success', async () => {
    const {deleteSession} = await import('@/lib/auth/session')

    const response = await POST()

    expect(deleteSession).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toEqual({success: true})
  })

  it('should handle session deletion errors gracefully', async () => {
    const {deleteSession} = await import('@/lib/auth/session')
    vi.mocked(deleteSession).mockRejectedValue(new Error('Session error'))

    await expect(POST()).rejects.toThrow('Session error')
  })
})
