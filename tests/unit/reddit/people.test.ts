import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sample } from '@/tests/helpers/fixtures'

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'fixture_user' })),
}))

const { getProfile, getSaved, getUserListing, searchPeople, searchPosts, searchSubreddits } =
  await import('@/lib/reddit/people')
const { setSubscription } = await import('@/lib/reddit/writes')
const { RedditNotFoundError } = await import('@/lib/reddit/errors')
const { parseFeedQuery, PROFILE_SORTS } = await import('@/lib/url-state')

const listing = (children: unknown[], after: string | null = null) => ({
  kind: 'Listing',
  data: { after, before: null, children },
})
const post = { kind: 't3', data: sample('Link') }
const comment = {
  kind: 't1',
  data: { ...sample('Comment', (v) => typeof v.link_title === 'string'), replies: '' },
}

beforeEach(() => {
  redditFetch.mockReset()
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('getSaved', () => {
  it('lists the viewer’s saved posts and comments', async () => {
    redditFetch.mockResolvedValue(listing([post, comment], 't1_next'))
    const page = await getSaved('all', parseFeedQuery({}, ['new']))
    expect(redditFetch).toHaveBeenCalledWith('/user/fixture_user/saved', {
      token: 'tok',
      query: { limit: 25, after: null, before: null, count: undefined, type: undefined },
    })
    expect(page.items.map((item) => item.kind)).toEqual(['post', 'comment'])
    expect(page.after).toBe('t1_next')
  })

  it('filters by type and pages', async () => {
    redditFetch.mockResolvedValue(listing([]))
    await getSaved('comments', parseFeedQuery({ after: 't1_a', count: '25' }, ['new']))
    expect(redditFetch.mock.calls[0]![1].query).toMatchObject({
      type: 'comments',
      after: 't1_a',
      count: 25,
    })
  })
})

describe('getUserListing', () => {
  it('reads a profile tab with its sort and range', async () => {
    redditFetch.mockResolvedValue(listing([comment]))
    const page = await getUserListing(
      'spez',
      'comments',
      parseFeedQuery({ sort: 'top', t: 'all' }, PROFILE_SORTS),
    )
    expect(redditFetch.mock.calls[0]![0]).toBe('/user/spez/comments')
    expect(redditFetch.mock.calls[0]![1].query).toMatchObject({ sort: 'top', t: 'all' })
    expect(page.items[0]?.kind).toBe('comment')
    await getUserListing('spez', 'overview', parseFeedQuery({}, PROFILE_SORTS))
    expect(redditFetch.mock.calls[1]![1].query).toMatchObject({ sort: 'new', t: undefined })
  })

  it('refuses bad usernames', async () => {
    await expect(getUserListing('../x', 'overview', parseFeedQuery({}))).rejects.toBeInstanceOf(
      RedditNotFoundError,
    )
    expect(redditFetch).not.toHaveBeenCalled()
  })
})

describe('getProfile', () => {
  it('maps an active account', async () => {
    redditFetch.mockResolvedValue({ kind: 't2', data: sample('Account') })
    const profile = await getProfile('spez')
    expect(redditFetch).toHaveBeenCalledWith('/user/spez/about', { token: 'tok' })
    expect(profile).toMatchObject({ kind: 'active', user: { name: sample('Account').name } })
  })

  it('recognizes a suspended account', async () => {
    redditFetch.mockResolvedValue({ kind: 't2', data: { name: 'gone', is_suspended: true } })
    expect(await getProfile('gone_user')).toEqual({ kind: 'suspended', name: 'gone' })
  })

  it('refuses bad usernames', async () => {
    await expect(getProfile('x')).rejects.toBeInstanceOf(RedditNotFoundError)
  })
})

describe('searchSubreddits', () => {
  it('searches communities, NSFW included', async () => {
    redditFetch.mockResolvedValue(listing([{ kind: 't5', data: sample('Subreddit') }], 't5_next'))
    const page = await searchSubreddits('typescript', parseFeedQuery({}, ['new']))
    expect(redditFetch.mock.calls[0]![0]).toBe('/subreddits/search')
    expect(redditFetch.mock.calls[0]![1].query).toMatchObject({
      q: 'typescript',
      include_over_18: 'on',
      limit: 25,
    })
    expect(page.items).toHaveLength(1)
    expect(page.after).toBe('t5_next')
  })
})

describe('searchPeople', () => {
  it('searches accounts and maps them to follow rows', async () => {
    const account = sample('Account')
    redditFetch.mockResolvedValue(listing([{ kind: 't2', data: account }], 't2_next'))
    const page = await searchPeople('spez', parseFeedQuery({}, ['new']))
    expect(redditFetch.mock.calls[0]![0]).toBe('/users/search')
    expect(redditFetch.mock.calls[0]![1].query).toMatchObject({ q: 'spez', include_over_18: 'on' })
    expect(page.items[0]).toMatchObject({ kind: 'user', name: account.name })
    expect(page.items[0]!.href).toBe(`/user/${account.name}`)
    expect(page.after).toBe('t2_next')
  })
})

describe('searchPosts', () => {
  it('searches all of Reddit for links, most relevant first', async () => {
    redditFetch.mockResolvedValue(listing([{ kind: 't3', data: sample('Link') }], 't3_next'))
    const page = await searchPosts('typescript', parseFeedQuery({}, ['new']))
    expect(redditFetch.mock.calls[0]![0]).toBe('/search')
    expect(redditFetch.mock.calls[0]![1].query).toMatchObject({
      q: 'typescript',
      type: 'link',
      sort: 'relevance',
    })
    expect(page.items[0]!.kind).toBe('post')
    expect(page.after).toBe('t3_next')
  })
})

describe('setSubscription', () => {
  it('joins and leaves', async () => {
    redditFetch.mockResolvedValue({})
    await setSubscription('typescript', true)
    await setSubscription('u_spez', false)
    expect(redditFetch.mock.calls.map((call) => call[1].form)).toEqual([
      { action: 'sub', sr_name: 'typescript', skip_initial_defaults: true },
      { action: 'unsub', sr_name: 'u_spez', skip_initial_defaults: true },
    ])
  })
})
