import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ListItem, PostView, SubredditView } from '@/lib/view-models'
import { renderServer } from '@/tests/helpers/render-server'
import { multiView, postView, subredditView } from '@/tests/helpers/views'

interface Page {
  items: PostView[]
  after: string | null
  before: null
}
const getFeed = vi.fn<(source: unknown, query: unknown) => Promise<Page>>(async () => ({
  items: [postView({ id: 'b', fullname: 't3_b' })],
  after: 't3_b',
  before: null,
}))
const getMyMultis = vi.fn(async () => [multiView()])
vi.mock('@/lib/reddit/reads', () => ({ getFeed, getMyMultis }))

const mixed = {
  items: [{ kind: 'post', post: postView() }] as ListItem[],
  after: 't3_c',
  before: null,
}
const rows = { items: [subredditView()] as SubredditView[], after: null, before: null }
const getSaved = vi.fn(async () => mixed)
const getUserListing = vi.fn(async () => mixed)
const searchPosts = vi.fn(async () => mixed)
const searchSubreddits = vi.fn(async () => rows)
const searchPeople = vi.fn(async () => rows)
vi.mock('@/lib/reddit/people', () => ({
  getSaved,
  getUserListing,
  searchPosts,
  searchSubreddits,
  searchPeople,
}))
vi.mock('@/app/actions/subscriptions', () => ({ setSubscription: vi.fn() }))
vi.mock('@/app/actions/multis', () => ({ setMembership: vi.fn() }))
vi.mock('@/lib/settings', () => ({ getSettings: vi.fn(async () => ({ blurNsfw: false })) }))
vi.mock('@/app/actions/things', () => ({ vote: vi.fn(), setSaved: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ SessionUnavailableError: class extends Error {} }))

const { loadMoreFeed } = await import('@/app/actions/feed')
const { RedditNotFoundError } = await import('@/lib/reddit/errors')

const request = {
  source: { type: 'subreddit', name: 'pics' },
  sort: 'hot',
  t: 'week',
  after: 't3_a',
  count: 25,
  showSubreddit: false,
}

beforeEach(() => vi.clearAllMocks())

describe('loadMoreFeed', () => {
  it('renders the next page on the server and returns the next cursor', async () => {
    const result = await loadMoreFeed(request)
    expect(getFeed).toHaveBeenCalledWith(
      { type: 'subreddit', name: 'pics' },
      { sort: 'hot', t: 'week', after: 't3_a', before: null, count: 25 },
    )
    if (!result.ok) throw new Error('expected success')
    expect(result.data.after).toBe('t3_b')
    expect(await renderServer(<>{result.data.items}</>)).toContain('<article')
  })

  it.each([
    { ...request, after: 'not-a-cursor' },
    { ...request, sort: 'sideways' },
    { ...request, count: -1 },
    { ...request, source: { type: 'user', name: 'spez' } },
    { ...request, source: { type: 'search', q: '  ', tab: 'posts' } },
    { ...request, source: { type: 'saved', filter: 'everything' } },
    null,
  ])('rejects %o without calling Reddit', async (input) => {
    expect((await loadMoreFeed(input)).ok).toBe(false)
    expect(getFeed).not.toHaveBeenCalled()
  })

  it('turns a failed read into an action error', async () => {
    getFeed.mockRejectedValueOnce(new RedditNotFoundError())
    expect(await loadMoreFeed(request)).toMatchObject({ ok: false })
  })

  const cursor = { sort: 'hot', t: 'week', after: 't3_a', before: null, count: 25 }

  it.each([
    [{ type: 'saved', filter: 'links' }, getSaved, ['links', cursor]],
    [{ type: 'user', name: 'spez', tab: 'comments' }, getUserListing, ['spez', 'comments', cursor]],
    [{ type: 'search', q: 'cats', tab: 'posts' }, searchPosts, ['cats', cursor]],
  ] as const)('renders %o as a mixed list', async (source, read, args) => {
    const result = await loadMoreFeed({ ...request, source })
    expect(read).toHaveBeenCalledWith(...args)
    if (!result.ok) throw new Error('expected success')
    expect(result.data.after).toBe('t3_c')
    expect(await renderServer(<>{result.data.items}</>)).toContain('<article')
  })

  it('renders community and people search pages as rows, with multis for communities', async () => {
    const communities = await loadMoreFeed({
      ...request,
      source: { type: 'search', q: 'cats', tab: 'communities' },
    })
    expect(searchSubreddits).toHaveBeenCalledWith('cats', cursor)
    if (!communities.ok) throw new Error('expected success')
    expect(await renderServer(<>{communities.data.items}</>)).toContain('to a multireddit')

    getMyMultis.mockRejectedValueOnce(new Error('down'))
    const fallback = await loadMoreFeed({
      ...request,
      source: { type: 'search', q: 'cats', tab: 'communities' },
    })
    expect(fallback.ok).toBe(true)

    const people = await loadMoreFeed({
      ...request,
      source: { type: 'search', q: 'cats', tab: 'people' },
    })
    expect(searchPeople).toHaveBeenCalledWith('cats', cursor)
    expect(getMyMultis).toHaveBeenCalledTimes(2)
    if (!people.ok) throw new Error('expected success')
    expect(people.data.after).toBeNull()
  })
})
