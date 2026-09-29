import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sample, samples } from '@/tests/helpers/fixtures'

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'fixture_user' })),
}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn() }))

const { getFeed, getMe, getMyMultis, getMySubscriptions, getSubreddit } =
  await import('@/lib/reddit/reads')
const { castVote, saveThing } = await import('@/lib/reddit/writes')
const { RedditNotFoundError, RedditSchemaError } = await import('@/lib/reddit/errors')
const { parseFeedQuery, LISTING_SORTS } = await import('@/lib/url-state')

const listing = (kind: string, items: unknown[], after: string | null = null) => ({
  kind: 'Listing',
  data: { after, before: null, children: items.map((data) => ({ kind, data })) },
})

beforeEach(() => {
  redditFetch.mockReset()
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('getFeed', () => {
  it('fetches the home feed and maps posts', async () => {
    const posts = samples('Link').slice(0, 3)
    redditFetch.mockResolvedValue(listing('t3', posts, 't3_next'))
    const page = await getFeed({ type: 'home' }, parseFeedQuery({}))

    expect(redditFetch).toHaveBeenCalledWith('/best', {
      token: 'tok',
      query: {
        limit: 25,
        t: undefined,
        after: null,
        before: null,
        count: undefined,
        include_over_18: 'on',
      },
    })
    expect(page.items.map((post) => post.id)).toEqual(posts.map((post) => post.id))
    expect(page.after).toBe('t3_next')
  })

  it('builds subreddit and multi paths with sort, range, and cursors', async () => {
    redditFetch.mockResolvedValue(listing('t3', []))
    const query = parseFeedQuery(
      { sort: 'top', t: 'week', after: 't3_a', count: '25' },
      LISTING_SORTS,
    )
    await getFeed({ type: 'subreddit', name: 'pics' }, query)
    expect(redditFetch.mock.calls[0]![0]).toBe('/r/pics/top')
    expect(redditFetch.mock.calls[0]![1].query).toMatchObject({
      t: 'week',
      after: 't3_a',
      count: 25,
    })

    await getFeed({ type: 'multi', owner: 'spez', name: 'news' }, query)
    expect(redditFetch.mock.calls[1]![0]).toBe('/user/spez/m/news/top')
  })

  it.each([
    { type: 'subreddit' as const, name: '../api' },
    { type: 'multi' as const, owner: 'a', name: 'news' },
    { type: 'multi' as const, owner: 'spez', name: 'x/y' },
  ])('refuses unsafe names before calling Reddit: %o', async (source) => {
    await expect(getFeed(source, parseFeedQuery({}))).rejects.toBeInstanceOf(RedditNotFoundError)
    expect(redditFetch).not.toHaveBeenCalled()
  })
})

describe('getSubreddit', () => {
  it('maps the about page', async () => {
    const about = sample('Subreddit', (v) => v.subreddit_type === 'public')
    redditFetch.mockResolvedValue({ kind: 't5', data: about })
    const view = await getSubreddit(String(about.display_name))
    expect(redditFetch).toHaveBeenCalledWith(`/r/${String(about.display_name)}/about`, {
      token: 'tok',
    })
    expect(view.name).toBe(about.display_name)
  })

  it('rejects bad names and bad envelopes', async () => {
    await expect(getSubreddit('a')).rejects.toBeInstanceOf(RedditNotFoundError)
    redditFetch.mockResolvedValue({ kind: 't3', data: {} })
    await expect(getSubreddit('pics')).rejects.toBeInstanceOf(RedditSchemaError)
  })
})

describe('getMySubscriptions', () => {
  it('pages through every subscription and sorts by name', async () => {
    const [a, b, c] = samples('Subreddit')
    redditFetch
      .mockResolvedValueOnce(listing('t5', [b, a], 't5_next'))
      .mockResolvedValueOnce(listing('t5', [c]))
    const all = await getMySubscriptions()

    expect(redditFetch).toHaveBeenCalledTimes(2)
    expect(redditFetch.mock.calls[1]![1].query).toEqual({ limit: 100, after: 't5_next' })
    const names = all.map((entry) => entry.name)
    expect(names).toEqual(
      [...names].sort((x, y) => x.localeCompare(y, 'en', { sensitivity: 'base' })),
    )
    expect(names).toHaveLength(3)
  })

  it('stops after ten pages', async () => {
    redditFetch.mockResolvedValue(listing('t5', [], 't5_more'))
    await getMySubscriptions()
    expect(redditFetch).toHaveBeenCalledTimes(10)
  })
})

describe('getMyMultis', () => {
  it('parses the bare array, drops bad items, and sorts by display name', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const multis = samples('LabeledMulti').slice(0, 3)
    redditFetch.mockResolvedValue([
      ...multis.map((data) => ({ kind: 'LabeledMulti', data })),
      { kind: 'LabeledMulti', data: {} },
    ])
    const views = await getMyMultis()
    expect(views).toHaveLength(3)
    expect(views[0]!.href).toMatch(/^\/m\//)
    const names = views.map((view) => view.displayName)
    expect(names).toEqual(
      [...names].sort((x, y) => x.localeCompare(y, 'en', { sensitivity: 'base' })),
    )
  })
})

describe('getMe', () => {
  it('returns the name and avatar', async () => {
    redditFetch.mockResolvedValue(sample('Me'))
    expect(await getMe()).toMatchObject({ name: 'fixture_user' })
    expect(redditFetch).toHaveBeenCalledWith('/api/v1/me', { token: 'tok' })
  })
})

describe('writes', () => {
  it('votes', async () => {
    redditFetch.mockResolvedValue({})
    await castVote('t3_abc', -1)
    expect(redditFetch).toHaveBeenCalledWith('/api/vote', {
      token: 'tok',
      method: 'POST',
      form: { id: 't3_abc', dir: -1 },
    })
  })

  it('saves and unsaves', async () => {
    redditFetch.mockResolvedValue({})
    await saveThing('t1_abc', true)
    await saveThing('t1_abc', false)
    expect(redditFetch.mock.calls.map((call) => call[0])).toEqual(['/api/save', '/api/unsave'])
  })

  it('fails on an unexpected response', async () => {
    redditFetch.mockResolvedValue([])
    await expect(castVote('t3_abc', 1)).rejects.toBeInstanceOf(RedditSchemaError)
  })
})
