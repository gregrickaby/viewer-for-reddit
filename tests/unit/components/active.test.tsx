import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostView } from '@/lib/view-models'
import { postView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

const state = { posts: [] as PostView[], error: null as unknown }
const getActiveThreads = vi.fn(async (_now: number) => {
  if (state.error) throw state.error
  return state.posts
})
vi.mock('@/lib/reddit/active', () => ({ getActiveThreads }))
vi.mock('@/lib/settings', () => ({ getSettings: vi.fn(async () => ({ blurNsfw: false })) }))
vi.mock('@/lib/request-time', () => ({ requestTime: vi.fn(async () => 1_700_003_600_000) }))
vi.mock('@/app/actions/things', () => ({ vote: vi.fn(), setSaved: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  unstable_rethrow: vi.fn(),
}))

const { ActiveSection } = await import('@/components/feed/active-section')
const activePage = await import('@/app/(app)/active/page')
const errors = await import('@/lib/reddit/errors')

beforeEach(() => {
  state.posts = [postView({ id: 'g1', title: 'Game Thread: A @ B' })]
  state.error = null
})

describe('ActiveSection', () => {
  it('lists the threads, with their communities', async () => {
    const out = await renderServer(<ActiveSection />)
    expect(out).toContain('Game Thread: A @ B')
    expect(out).toContain('aria-label="Active threads"')
    expect(getActiveThreads).toHaveBeenCalledWith(1_700_003_600_000)
  })

  it('says so when nothing is busy', async () => {
    state.posts = []
    expect(await renderServer(<ActiveSection />)).toContain('Nothing busy right now')
  })

  it('shows a forbidden search as a panel, and rethrows anything else', async () => {
    state.error = new errors.RedditForbiddenError('private')
    expect(await renderServer(<ActiveSection />)).toContain('This community is private')
    state.error = new errors.RedditApiError('boom', 500)
    await expect(renderServer(<ActiveSection />)).rejects.toThrow('boom')
  })
})

describe('active page', () => {
  it('has a title and renders the section', async () => {
    const out = await renderServer(activePage.default())
    expect(out).toContain('Active threads</h1>')
    expect(out).toContain('Game Thread: A @ B')
    expect(activePage.metadata.title).toBe('Active threads')
  })
})
