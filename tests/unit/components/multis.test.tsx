import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MultiView, SubredditView } from '@/lib/view-models'
import { multiView, subredditView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

const state = {
  multis: [] as MultiView[],
  multi: multiView(),
  multiError: null as unknown,
  subscriptions: [] as SubredditView[],
  subscriptionsError: false,
}
vi.mock('@/lib/reddit/reads', () => ({
  getMyMultis: vi.fn(async () => state.multis),
  getMySubscriptions: vi.fn(async () => {
    if (state.subscriptionsError) throw new Error('down')
    return state.subscriptions
  }),
}))
vi.mock('@/lib/reddit/multis', () => ({
  getMulti: vi.fn(async () => {
    if (state.multiError) throw state.multiError
    return state.multi
  }),
}))
vi.mock('@/app/actions/multis', () => ({
  createMultiForm: vi.fn(),
  updateMultiForm: vi.fn(),
  addToMultiForm: vi.fn(),
  deleteMulti: vi.fn(),
  setMembership: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  unstable_rethrow: vi.fn(),
}))

const { AddToMultiMenu } = await import('@/components/multi/add-to-multi-menu')
const listPage = await import('@/app/(app)/multis/page')
const editPage = await import('@/app/(app)/multis/[multi]/page')
const errors = await import('@/lib/reddit/errors')
const { notFound } = await import('next/navigation')

beforeEach(() => {
  state.multis = []
  state.multi = multiView()
  state.multiError = null
  state.subscriptions = []
  state.subscriptionsError = false
})

describe('AddToMultiMenu', () => {
  it('lists editable multis with checkmarks for membership', async () => {
    const out = await renderServer(
      <AddToMultiMenu
        subreddit="News"
        multis={[
          multiView(),
          multiView({ name: 'dev', displayName: 'Dev', subreddits: ['nextjs'] }),
          multiView({ name: 'theirs', displayName: 'Theirs', canEdit: false }),
        ]}
      />,
    )
    expect(out).toContain('aria-label="Add r/News to a multireddit"')
    expect(out).toContain('Add r/<!-- -->News<!-- --> to…')
    expect(out).toMatch(/aria-pressed="true"[^>]*>.*News/)
    expect(out).toMatch(/aria-pressed="false"[^>]*>.*Dev/)
    expect(out).not.toContain('Theirs')
    expect(out).toContain('href="/multis"')
  })

  it('says when there are no multis', async () => {
    expect(await renderServer(<AddToMultiMenu subreddit="pics" multis={[]} />)).toContain(
      'You don’t have any multireddits yet.',
    )
  })
})

describe('/multis', () => {
  it('lists multis with counts, visibility, and edit links, plus a create form', async () => {
    state.multis = [
      multiView(),
      multiView({
        name: 'solo',
        displayName: 'Solo',
        href: '/m/solo',
        subreddits: ['a'],
        visibility: 'public',
      }),
      multiView({
        name: 'shared',
        displayName: 'Shared',
        href: '/user/x/m/shared',
        canEdit: false,
      }),
    ]
    expect(listPage.metadata).toEqual({ title: 'Multireddits' })
    const out = await renderServer(<listPage.default />)
    expect(out).toContain('2<!-- --> <!-- -->communities<!-- --> ·<!-- --> <!-- -->Private')
    expect(out).toContain('1<!-- --> <!-- -->community<!-- --> ·<!-- --> <!-- -->Public')
    expect(out).toContain('href="/multis/news"')
    expect(out).not.toContain('href="/multis/shared"')
    expect(out).toContain('name="displayName"')
  })

  it('explains multis when there are none', async () => {
    expect(await renderServer(<listPage.default />)).toContain('No multireddits yet')
  })
})

describe('/multis/[multi]', () => {
  const params = Promise.resolve({ multi: 'news' })
  const render = () =>
    renderServer(<editPage.default params={params} searchParams={Promise.resolve({})} />)

  it('edits details, members, suggestions, and offers delete', async () => {
    state.subscriptions = [
      subredditView({ name: 'News', fullname: 't5_n' }),
      subredditView({ name: 'aww', fullname: 't5_a' }),
      subredditView({ name: 'spez', fullname: 't5_u', kind: 'user' }),
    ]
    expect(await editPage.generateMetadata({ params, searchParams: Promise.resolve({}) })).toEqual({
      title: 'Edit m/news',
    })
    const out = await render()
    expect(out).toContain('href="/m/news"')
    expect(out).toContain('value="News"')
    expect(out).toMatch(/value="private" checked=""|checked="" value="private"/)
    expect(out).toContain('Communities (<!-- -->2<!-- -->)')
    expect(out).toContain('aria-label="Remove r/news from News"')
    expect(out).toContain('From your subscriptions')
    expect(out).toContain('aria-label="Add r/aww to News"')
    expect(out).not.toContain('r/<!-- -->spez')
    expect(out).toContain('Delete <!-- -->News<!-- -->? This can’t be undone.')
  })

  it('handles an empty multi and missing subscriptions', async () => {
    state.multi = multiView({ subreddits: [] })
    state.subscriptionsError = true
    const out = await render()
    expect(out).toContain('No communities yet.')
    expect(out).not.toContain('From your subscriptions')
  })

  it('refuses multis the viewer can’t edit, and 404s missing ones', async () => {
    state.multiError = new errors.RedditForbiddenError('unknown')
    expect(await render()).toContain('Reddit won’t let you edit this multireddit.')
    state.multiError = new errors.RedditNotFoundError()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // The section's error boundary receives the 404, and Next renders the not-found page.
    await render().catch(() => {})
    expect(notFound).toHaveBeenCalled()
  })
})
