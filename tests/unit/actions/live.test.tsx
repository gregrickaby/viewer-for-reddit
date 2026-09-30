import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LiveUpdateView } from '@/lib/view-models'
import { html } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

const updateView = (name: string): LiveUpdateView => ({
  name,
  author: 'alice',
  body: html('<p>Breaking</p>'),
  createdUtc: 1_700_000_000,
  stricken: false,
})

const NEWEST = 'LiveUpdate_362ac036-b5eb-11f1-946d-ceb77989b019'
const CURSOR = 'LiveUpdate_6603ce62-b094-11f1-94e4-7ec5abe59ad0'

type Page = { items: LiveUpdateView[]; after: string | null; before: null }
const getLiveUpdates = vi.fn<(id: string, query: unknown) => Promise<Page>>(async () => ({
  items: [updateView(NEWEST)],
  after: CURSOR,
  before: null,
}))
const getLiveEvent = vi.fn<(id: string) => Promise<{ live: boolean; viewers: number | null }>>(
  async () => ({ live: false, viewers: 7 }),
)
vi.mock('@/lib/reddit/live', () => ({ getLiveUpdates, getLiveEvent }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ SessionUnavailableError: class extends Error {} }))

const { pollLive, loadOlderLive } = await import('@/app/actions/live')
const { RedditNotFoundError } = await import('@/lib/reddit/errors')

const ID = '1hnbhsgiy1dhh'

beforeEach(() => {
  getLiveUpdates.mockClear()
  getLiveEvent.mockClear()
})

describe('pollLive', () => {
  it('renders what is newer than the cursor on the server', async () => {
    const result = await pollLive({ id: ID, before: CURSOR, meta: false })
    expect(getLiveUpdates).toHaveBeenCalledWith(ID, { before: CURSOR })
    expect(getLiveEvent).not.toHaveBeenCalled()
    if (!result.ok) throw new Error('expected success')
    expect(result.data).toMatchObject({ count: 1, newest: NEWEST, event: null })
    expect(await renderServer(<ol>{result.data.items}</ol>)).toContain('Breaking')
  })

  it('also reads the thread when asked, for its state and viewers', async () => {
    const result = await pollLive({ id: ID, before: null, meta: true })
    if (!result.ok) throw new Error('expected success')
    expect(result.data.event).toEqual({ live: false, viewers: 7 })
  })

  it('has no newest cursor when nothing new came back', async () => {
    getLiveUpdates.mockResolvedValueOnce({ items: [], after: null, before: null })
    const result = await pollLive({ id: ID, before: CURSOR, meta: false })
    if (!result.ok) throw new Error('expected success')
    expect(result.data).toMatchObject({ count: 0, newest: null })
  })

  it('returns a typed error when Reddit no longer has the thread', async () => {
    getLiveUpdates.mockRejectedValueOnce(new RedditNotFoundError())
    expect(await pollLive({ id: ID, before: null, meta: false })).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    })
  })

  it.each([
    { id: '../me', before: null, meta: false },
    { id: ID, before: 'LiveUpdate_short', meta: false },
    { id: ID, before: null },
    null,
  ])('rejects %o without calling Reddit', async (input) => {
    expect(await pollLive(input)).toMatchObject({ ok: false, error: { code: 'INVALID' } })
    expect(getLiveUpdates).not.toHaveBeenCalled()
  })
})

describe('loadOlderLive', () => {
  it('renders the page before the cursor and returns the next cursor', async () => {
    const result = await loadOlderLive({ id: ID, after: CURSOR })
    expect(getLiveUpdates).toHaveBeenCalledWith(ID, { after: CURSOR })
    if (!result.ok) throw new Error('expected success')
    expect(result.data.after).toBe(CURSOR)
    expect(await renderServer(<ol>{result.data.items}</ol>)).toContain('Breaking')
  })

  it.each([{ id: ID, after: null }, { id: 'x', after: CURSOR }, undefined])(
    'rejects %o',
    async (input) => {
      expect(await loadOlderLive(input)).toMatchObject({ ok: false, error: { code: 'INVALID' } })
      expect(getLiveUpdates).not.toHaveBeenCalled()
    },
  )
})
