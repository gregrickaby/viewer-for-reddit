import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostView } from '@/lib/view-models'
import { postView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

type Page = { items: PostView[]; after: string | null; before: null }
const getFeed = vi.fn<(source: unknown, query: unknown) => Promise<Page>>(async () => ({
  items: [postView({ id: 'b', fullname: 't3_b' })],
  after: 't3_b',
  before: null,
}))
vi.mock('@/lib/reddit/reads', () => ({ getFeed }))
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

beforeEach(() => getFeed.mockClear())

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
    null,
  ])('rejects %o without calling Reddit', async (input) => {
    expect((await loadMoreFeed(input)).ok).toBe(false)
    expect(getFeed).not.toHaveBeenCalled()
  })

  it('turns a failed read into an action error', async () => {
    getFeed.mockRejectedValueOnce(new RedditNotFoundError())
    expect(await loadMoreFeed(request)).toMatchObject({ ok: false })
  })
})
