import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LiveEventView, LiveUpdateView } from '@/lib/view-models'
import { html } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

const CURSOR = 'LiveUpdate_6603ce62-b094-11f1-94e4-7ec5abe59ad0'

const state = {
  event: null as LiveEventView | null,
  after: CURSOR as string | null,
  error: null as unknown,
}
const eventView = (overrides: Partial<LiveEventView> = {}): LiveEventView => ({
  id: 'abc1234567',
  title: 'Big Match',
  description: html('<p>Scores and news</p>'),
  resources: html('<p>Sources</p>'),
  live: true,
  viewers: 12,
  nsfw: false,
  createdUtc: 1_700_000_000,
  ...overrides,
})
const update = (name: string, overrides: Partial<LiveUpdateView> = {}): LiveUpdateView => ({
  name,
  author: 'alice',
  body: html('<p>Goal</p>'),
  createdUtc: 1_700_000_000,
  stricken: false,
  ...overrides,
})

const getLiveEvent = vi.fn(async () => {
  if (state.error) throw state.error
  return state.event!
})
type Page = { items: LiveUpdateView[]; after: string | null; before: null }
const getLiveUpdates = vi.fn<(id: string, query: unknown) => Promise<Page>>(async () => ({
  items: [
    update('LiveUpdate_a'),
    update('LiveUpdate_b', { author: null, stricken: true, body: null }),
  ],
  after: state.after,
  before: null,
}))
vi.mock('@/lib/reddit/live', () => ({ getLiveEvent, getLiveUpdates }))
vi.mock('@/lib/request-time', () => ({ requestTime: vi.fn(async () => 1_700_003_600_000) }))
vi.mock('@/app/actions/live', () => ({ pollLive: vi.fn(), loadOlderLive: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  unstable_rethrow: vi.fn(),
}))

const { LiveSection, LiveSkeleton } = await import('@/components/live/live-section')
const livePage = await import('@/app/(app)/live/[id]/page')
const errors = await import('@/lib/reddit/errors')

const render = (search: Record<string, string | string[] | undefined> = {}) =>
  renderServer(
    <LiveSection
      params={Promise.resolve({ id: 'abc1234567' })}
      searchParams={Promise.resolve(search)}
    />,
  )

beforeEach(() => {
  state.event = eventView()
  state.after = CURSOR
  state.error = null
  getLiveUpdates.mockClear()
})

describe('LiveSection', () => {
  it('renders the title, notes, updates, and a way to reload without JavaScript', async () => {
    const markup = await render()
    expect(markup).toContain('Big Match')
    expect(markup).toContain('Scores and news')
    expect(markup).toContain('Sources')
    expect(markup).toContain('href="/user/alice"')
    expect(markup).toContain('Goal')
    expect(markup).toContain('· 12 viewers')
    expect(markup).toContain('<noscript>')
    expect(markup).toContain(`/live/abc1234567?after=${CURSOR}`)
    expect(getLiveUpdates).toHaveBeenCalledWith('abc1234567', { after: null })
  })

  it('omits the notes and the older link when there are none', async () => {
    state.event = eventView({ description: null, resources: null })
    state.after = null
    const markup = await render()
    expect(markup).not.toContain('Scores and news')
    expect(markup).not.toContain('?after=')
  })

  it('shows a struck update with no author', async () => {
    expect(await render()).toContain('Struck')
  })

  it('shows an older page as plain links, without the live island', async () => {
    const markup = await render({ after: CURSOR })
    expect(getLiveUpdates).toHaveBeenCalledWith('abc1234567', { after: CURSOR })
    expect(markup).toContain('Latest updates')
    expect(markup).toContain('Older updates')
    expect(markup).not.toContain('class="status"')
  })

  it('has no older link on the last page', async () => {
    state.after = null
    const markup = await render({ after: CURSOR })
    expect(markup).toContain('Latest updates')
    expect(markup).not.toContain('Older updates')
  })

  it('ignores a cursor that is not one', async () => {
    await render({ after: 'nope' })
    expect(getLiveUpdates).toHaveBeenCalledWith('abc1234567', { after: null })
  })

  it('shows a forbidden thread as a panel', async () => {
    state.error = new errors.RedditForbiddenError('private')
    expect(await render()).toContain('This community is private')
  })

  it('rethrows other failures to the section error boundary', async () => {
    state.error = new errors.RedditApiError('boom', 500)
    await expect(render()).rejects.toThrow('boom')
  })
})

describe('live page', () => {
  it('renders the skeleton then the section', async () => {
    const markup = await renderServer(
      livePage.default({
        params: Promise.resolve({ id: 'abc1234567' }),
        searchParams: Promise.resolve({}),
      } as never),
    )
    expect(markup).toContain('Big Match')
    expect(livePage.metadata.title).toBe('Live thread')
  })

  it('has a skeleton', async () => {
    expect(await renderServer(<LiveSkeleton />)).toContain('skeleton')
  })
})
