import { beforeEach, describe, expect, it, vi } from 'vitest'

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'fixture_user' })),
}))

const { getLiveEvent, getLiveUpdates, LIVE_PAGE_SIZE } = await import('@/lib/reddit/live')
const { RedditNotFoundError, RedditSchemaError } = await import('@/lib/reddit/errors')

const ID = '1hnbhsgiy1dhh'
const CURSOR = 'LiveUpdate_362ac036-b5eb-11f1-946d-ceb77989b019'

const event = (overrides: Record<string, unknown> = {}) => ({
  kind: 'LiveUpdateEvent',
  data: {
    id: ID,
    title: 'Ukraine-Russia War',
    description_html: '<div class="md"><p>Updates</p></div>',
    resources_html: '',
    state: 'live',
    viewer_count: 4,
    nsfw: false,
    created_utc: 1_788_464_543,
    ...overrides,
  },
})

const update = (name: string, overrides: Record<string, unknown> = {}) => ({
  kind: 'LiveUpdate',
  data: {
    name,
    author: 'alice',
    body_html: '<div class="md"><p>Something happened</p></div>',
    created_utc: 1_790_015_725,
    stricken: false,
    ...overrides,
  },
})

const listing = (children: unknown[]) => ({
  kind: 'Listing',
  data: { after: null, before: null, children },
})

beforeEach(() => redditFetch.mockReset())

describe('getLiveEvent', () => {
  it('maps the thread to a view model', async () => {
    redditFetch.mockResolvedValue(event())
    const view = await getLiveEvent(ID)
    expect(redditFetch).toHaveBeenCalledWith(`/live/${ID}/about`, { token: 'tok' })
    expect(view).toMatchObject({
      id: ID,
      title: 'Ukraine-Russia War',
      live: true,
      viewers: 4,
      nsfw: false,
      resources: null,
    })
    expect(view.description).toContain('Updates')
  })

  it('treats a closed thread, and a missing viewer count, as such', async () => {
    redditFetch.mockResolvedValue(event({ state: 'complete', viewer_count: null }))
    expect(await getLiveEvent(ID)).toMatchObject({ live: false, viewers: null })
  })

  it('rejects an id that could change the API path, without calling Reddit', async () => {
    await expect(getLiveEvent('../me')).rejects.toBeInstanceOf(RedditNotFoundError)
    expect(redditFetch).not.toHaveBeenCalled()
  })

  it('reports a response that is not a live thread', async () => {
    redditFetch.mockResolvedValue({ kind: 't5', data: {} })
    await expect(getLiveEvent(ID)).rejects.toBeInstanceOf(RedditSchemaError)
  })
})

describe('getLiveUpdates', () => {
  it('maps updates, newest first, and passes the cursor through', async () => {
    redditFetch.mockResolvedValue({
      ...listing([update(CURSOR), update('LiveUpdate_x', { author: '[deleted]', stricken: true })]),
      data: { after: 'LiveUpdate_older', before: null, children: [update(CURSOR)] },
    })
    const page = await getLiveUpdates(ID, { after: null })
    expect(redditFetch).toHaveBeenCalledWith(`/live/${ID}`, {
      token: 'tok',
      query: { limit: LIVE_PAGE_SIZE, after: null, before: null },
    })
    expect(page.after).toBe('LiveUpdate_older')
    expect(page.items[0]).toMatchObject({ name: CURSOR, author: 'alice', stricken: false })
    expect(page.items[0]!.body).toContain('Something happened')
  })

  it('shows a deleted author and a struck update', async () => {
    redditFetch.mockResolvedValue(
      listing([update(CURSOR, { author: '[deleted]', stricken: true, body_html: null })]),
    )
    const [item] = (await getLiveUpdates(ID)).items
    expect(item).toMatchObject({ author: null, stricken: true, body: null })
  })

  it('asks for a large page when polling, so a busy thread is not cut off', async () => {
    redditFetch.mockResolvedValue(listing([]))
    await getLiveUpdates(ID, { before: CURSOR })
    expect(redditFetch.mock.calls[0]![1].query).toEqual({ limit: 100, after: null, before: CURSOR })
  })

  it('drops an update that does not fit the schema instead of failing the page', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    redditFetch.mockResolvedValue(
      listing([{ kind: 'LiveUpdate', data: { name: 1 } }, update(CURSOR)]),
    )
    expect((await getLiveUpdates(ID)).items).toHaveLength(1)
  })

  it.each([[{ after: 'nope' }], [{ before: 'LiveUpdate_short' }]])(
    'rejects the cursor %o without calling Reddit',
    async (cursor) => {
      await expect(getLiveUpdates(ID, cursor)).rejects.toBeInstanceOf(RedditNotFoundError)
      expect(redditFetch).not.toHaveBeenCalled()
    },
  )

  it('rejects a bad id', async () => {
    await expect(getLiveUpdates('x')).rejects.toBeInstanceOf(RedditNotFoundError)
  })
})
