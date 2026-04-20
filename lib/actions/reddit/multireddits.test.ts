// Mock rate-limit-state BEFORE imports
vi.mock('@/lib/utils/rate-limit-state', () => ({
  recordRateLimit: vi.fn(),
  resetRateLimit: vi.fn(),
  waitForRateLimit: vi.fn(async () => {})
}))

// Mock reddit-context BEFORE imports
vi.mock('@/lib/auth/reddit-context', () => ({
  getRedditContext: vi.fn()
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: vi.fn((name: string) => {
      const mockHeaders: Record<string, string> = {
        'user-agent': 'Mozilla/5.0 Test Browser',
        'x-forwarded-for': '127.0.0.1',
        referer: 'http://localhost:3000'
      }
      return mockHeaders[name] || null
    })
  }))
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

import {type RedditContext, getRedditContext} from '@/lib/auth/reddit-context'
import {http, HttpResponse, server} from '@/test-utils'
import {revalidatePath} from 'next/cache'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  addSubredditToMultireddit,
  addUserToMultireddit,
  createMultireddit,
  deleteMultireddit,
  fetchMultireddits,
  removeSubredditFromMultireddit,
  removeUserFromMultireddit,
  updateMultiredditName
} from './multireddits'

const mockGetRedditContext = vi.mocked(getRedditContext)

function createAuthContext(username = 'testuser'): RedditContext {
  return {
    headers: {
      'User-Agent': 'test-user-agent',
      Authorization: 'Bearer mock-token'
    },
    baseUrl: 'https://oauth.reddit.com',
    isAuthenticated: true,
    username
  }
}

function createAnonContext(): RedditContext {
  return {
    headers: {
      'User-Agent': 'test-user-agent'
    },
    baseUrl: 'https://www.reddit.com',
    isAuthenticated: false,
    username: null
  }
}

describe('multireddits server actions', () => {
  beforeEach(() => {
    mockGetRedditContext.mockClear()
    mockGetRedditContext.mockResolvedValue(createAuthContext())
  })

  describe('fetchMultireddits', () => {
    it('returns empty array when not authenticated', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const multis = await fetchMultireddits()

      expect(multis).toEqual([])
    })

    it('fetches multireddits when authenticated', async () => {
      const multis = await fetchMultireddits()

      expect(Array.isArray(multis)).toBe(true)
    })
  })

  describe('createMultireddit', () => {
    it('creates a multireddit successfully', async () => {
      server.use(
        http.post('https://oauth.reddit.com/api/multi', () => {
          return HttpResponse.json({
            data: {path: '/user/testuser/m/my_multi'}
          })
        })
      )

      const result = await createMultireddit('my_multi', 'My Multi')

      expect(result.success).toBe(true)
      expect(result.path).toBe('/user/testuser/m/my_multi')
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await createMultireddit('my_multi', 'My Multi')

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid name (too short)', async () => {
      const result = await createMultireddit('ab', 'My Multi')

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid name (invalid chars)', async () => {
      const result = await createMultireddit('../attack', 'My Multi')

      expect(result.success).toBe(false)
    })

    it('returns failure for empty display name', async () => {
      const result = await createMultireddit('my_multi', '  ')

      expect(result.success).toBe(false)
    })

    it('returns failure when API call fails', async () => {
      server.use(
        http.post('https://oauth.reddit.com/api/multi', () => {
          return new HttpResponse(null, {status: 409})
        })
      )

      const result = await createMultireddit('my_multi', 'My Multi')

      expect(result.success).toBe(false)
    })
  })

  describe('deleteMultireddit', () => {
    it('deletes a multireddit successfully', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech',
          () => new HttpResponse(null, {status: 200})
        )
      )

      const result = await deleteMultireddit('/user/testuser/m/tech')

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await deleteMultireddit('/user/testuser/m/tech')

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid path', async () => {
      const result = await deleteMultireddit('/invalid/path')

      expect(result.success).toBe(false)
    })

    it('returns failure when API call fails', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech',
          () => new HttpResponse(null, {status: 403})
        )
      )

      const result = await deleteMultireddit('/user/testuser/m/tech')

      expect(result.success).toBe(false)
    })
  })

  describe('updateMultiredditName', () => {
    it('renames a multireddit successfully', async () => {
      server.use(
        http.put(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech',
          () => HttpResponse.json({data: {display_name: 'Tech & Science'}})
        )
      )

      const result = await updateMultiredditName(
        '/user/testuser/m/tech',
        'Tech & Science'
      )

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await updateMultiredditName(
        '/user/testuser/m/tech',
        'New Name'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure for empty display name', async () => {
      const result = await updateMultiredditName('/user/testuser/m/tech', '  ')

      expect(result.success).toBe(false)
    })

    it('returns failure for display name exceeding 50 chars', async () => {
      const result = await updateMultiredditName(
        '/user/testuser/m/tech',
        'A'.repeat(51)
      )

      expect(result.success).toBe(false)
    })
  })

  describe('addSubredditToMultireddit', () => {
    it('adds a subreddit successfully', async () => {
      server.use(
        http.put(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/typescript',
          () => HttpResponse.json({data: {name: 'typescript'}})
        )
      )

      const result = await addSubredditToMultireddit(
        '/user/testuser/m/tech',
        'typescript'
      )

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('strips r/ prefix from subreddit name', async () => {
      server.use(
        http.put(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/typescript',
          () => HttpResponse.json({data: {name: 'typescript'}})
        )
      )

      const result = await addSubredditToMultireddit(
        '/user/testuser/m/tech',
        'r/typescript'
      )

      expect(result.success).toBe(true)
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await addSubredditToMultireddit(
        '/user/testuser/m/tech',
        'typescript'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid subreddit name', async () => {
      const result = await addSubredditToMultireddit(
        '/user/testuser/m/tech',
        '../attack'
      )

      expect(result.success).toBe(false)
    })
  })

  describe('removeSubredditFromMultireddit', () => {
    it('removes a subreddit successfully', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/typescript',
          () => new HttpResponse(null, {status: 200})
        )
      )

      const result = await removeSubredditFromMultireddit(
        '/user/testuser/m/tech',
        'typescript'
      )

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('strips r/ prefix from subreddit name', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/typescript',
          () => new HttpResponse(null, {status: 200})
        )
      )

      const result = await removeSubredditFromMultireddit(
        '/user/testuser/m/tech',
        'r/typescript'
      )

      expect(result.success).toBe(true)
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await removeSubredditFromMultireddit(
        '/user/testuser/m/tech',
        'typescript'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid subreddit name', async () => {
      const result = await removeSubredditFromMultireddit(
        '/user/testuser/m/tech',
        '../attack'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure when API call fails', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/typescript',
          () => new HttpResponse(null, {status: 404})
        )
      )

      const result = await removeSubredditFromMultireddit(
        '/user/testuser/m/tech',
        'typescript'
      )

      expect(result.success).toBe(false)
    })
  })

  describe('addUserToMultireddit', () => {
    it('adds a user successfully via their user subreddit', async () => {
      server.use(
        http.put(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/u_johndoe',
          () => HttpResponse.json({data: {name: 'u_johndoe'}})
        )
      )

      const result = await addUserToMultireddit(
        '/user/testuser/m/tech',
        'johndoe'
      )

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('strips u/ prefix from username', async () => {
      server.use(
        http.put(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/u_johndoe',
          () => HttpResponse.json({data: {name: 'u_johndoe'}})
        )
      )

      const result = await addUserToMultireddit(
        '/user/testuser/m/tech',
        'u/johndoe'
      )

      expect(result.success).toBe(true)
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await addUserToMultireddit(
        '/user/testuser/m/tech',
        'johndoe'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid username', async () => {
      const result = await addUserToMultireddit(
        '/user/testuser/m/tech',
        '../attack'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure when API call fails', async () => {
      server.use(
        http.put(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/u_johndoe',
          () => new HttpResponse(null, {status: 500})
        )
      )

      const result = await addUserToMultireddit(
        '/user/testuser/m/tech',
        'johndoe'
      )

      expect(result.success).toBe(false)
    })
  })

  describe('removeUserFromMultireddit', () => {
    it('removes a user successfully via their user subreddit', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/u_johndoe',
          () => new HttpResponse(null, {status: 200})
        )
      )

      const result = await removeUserFromMultireddit(
        '/user/testuser/m/tech',
        'johndoe'
      )

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('strips u/ prefix from username', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/u_johndoe',
          () => new HttpResponse(null, {status: 200})
        )
      )

      const result = await removeUserFromMultireddit(
        '/user/testuser/m/tech',
        'u/johndoe'
      )

      expect(result.success).toBe(true)
    })

    it('returns failure for unauthenticated users', async () => {
      mockGetRedditContext.mockResolvedValue(createAnonContext())

      const result = await removeUserFromMultireddit(
        '/user/testuser/m/tech',
        'johndoe'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure for invalid username', async () => {
      const result = await removeUserFromMultireddit(
        '/user/testuser/m/tech',
        '../attack'
      )

      expect(result.success).toBe(false)
    })

    it('returns failure when API call fails', async () => {
      server.use(
        http.delete(
          'https://oauth.reddit.com/api/multi/user/testuser/m/tech/r/u_johndoe',
          () => new HttpResponse(null, {status: 404})
        )
      )

      const result = await removeUserFromMultireddit(
        '/user/testuser/m/tech',
        'johndoe'
      )

      expect(result.success).toBe(false)
    })
  })
})
