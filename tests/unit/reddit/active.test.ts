import { beforeEach, describe, expect, it, vi } from 'vitest'
import { samples } from '@/tests/helpers/fixtures'

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'fixture_user' })),
}))

const { ACTIVE_WINDOW_SECONDS, getActiveThreads } = await import('@/lib/reddit/active')

const NOW = 1_800_000_000_000
const [template] = samples('Link')

const link = (id: string, overrides: Record<string, unknown> = {}) => ({
  kind: 't3',
  data: {
    ...template,
    id,
    name: `t3_${id}`,
    created_utc: NOW / 1000 - 3600,
    num_comments: 500,
    locked: false,
    archived: false,
    ...overrides,
  },
})

const respond = (...links: unknown[]) =>
  redditFetch.mockResolvedValue({
    kind: 'Listing',
    data: { after: null, before: null, children: links },
  })

beforeEach(() => redditFetch.mockReset())

describe('getActiveThreads', () => {
  it('searches the last day for threads built to be watched, busiest first', async () => {
    respond()
    await getActiveThreads(NOW)
    const [path, request] = redditFetch.mock.calls[0]!
    expect(path).toBe('/search')
    expect(request.token).toBe('tok')
    expect(request.query).toMatchObject({ sort: 'comments', t: 'day', type: 'link', limit: 100 })
    for (const phrase of [
      'game thread',
      'match thread',
      'daily discussion',
      'live thread',
      'race thread',
    ])
      expect(request.query.q).toContain(`title:"${phrase}"`)
  })

  it('keeps recent, busy, open threads in the order Reddit ranked them', async () => {
    respond(link('a', { num_comments: 900 }), link('b', { num_comments: 40 }))
    expect((await getActiveThreads(NOW)).map((post) => post.id)).toEqual(['a', 'b'])
  })

  it.each([
    ['too old', { created_utc: NOW / 1000 - ACTIVE_WINDOW_SECONDS - 1 }],
    ['too quiet', { num_comments: 24 }],
    ['locked', { locked: true }],
    ['archived', { archived: true }],
  ])('drops a thread that is %s', async (_name, overrides) => {
    respond(link('keep'), link('drop', overrides))
    expect((await getActiveThreads(NOW)).map((post) => post.id)).toEqual(['keep'])
  })

  it('lists at most 25', async () => {
    respond(...Array.from({ length: 40 }, (_, index) => link(`t${index}`)))
    expect(await getActiveThreads(NOW)).toHaveLength(25)
  })
})
