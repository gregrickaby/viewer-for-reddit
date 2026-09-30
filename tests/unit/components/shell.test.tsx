import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MultiView, SubredditView } from '@/lib/view-models'
import { multiView, postView, subredditView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

const state = {
  username: 'spez' as string | null,
  me: { name: 'spez', icon: 'https://styles.redditmedia.com/avatar.png' as string | null },
  meError: false,
  subscriptions: [] as SubredditView[],
  multis: [] as MultiView[],
  listsError: null as unknown,
}

vi.mock('@/lib/auth/session', () => ({ getUsername: vi.fn(async () => state.username) }))
vi.mock('@/lib/reddit/reads', () => ({
  getMe: vi.fn(async () => {
    if (state.meError) throw new Error('rate limited')
    return state.me
  }),
  getMySubscriptions: vi.fn(async () => {
    if (state.listsError) throw state.listsError
    return state.subscriptions
  }),
  getMyMultis: vi.fn(async () => state.multis),
  getFeed: vi.fn(async () => ({ items: [postView()], after: null, before: null })),
  getSubreddit: vi.fn(async (name: string) => subredditView({ name })),
}))
vi.mock('@/lib/settings', () => ({
  getSettings: vi.fn(async () => ({ theme: 'dark', blurNsfw: false })),
}))
vi.mock('@/lib/request-time', () => ({ requestTime: vi.fn(async () => 1_700_000_000_000) }))
vi.mock('@/app/actions/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/app/actions/things', () => ({ vote: vi.fn(), setSaved: vi.fn() }))
vi.mock('@/app/actions/settings', () => ({ setTheme: vi.fn(), setBlurNsfw: vi.fn() }))

const { UserMenu, UserMenuSkeleton } = await import('@/components/shell/user-menu')
const { SettingsMenu, SettingsMenuSkeleton } = await import('@/components/shell/settings-menu')
const { SidebarFeeds, SidebarLists, SidebarSkeleton } = await import('@/components/shell/sidebar')
const { default: AppLayout } = await import('@/app/(app)/layout')
const { default: HomePage, metadata: homeMetadata } = await import('@/app/(app)/home/page')
const subredditPage = await import('@/app/(app)/r/[subreddit]/page')
const ownMultiPage = await import('@/app/(app)/m/[multi]/page')
const userMultiPage = await import('@/app/(app)/user/[username]/m/[multi]/page')
const { default: SettingsPage, metadata: settingsMetadata } =
  await import('@/app/(app)/settings/page')
const { default: NotFound } = await import('@/app/(app)/not-found')
const rootNotFound = await import('@/app/not-found')
const errors = await import('@/lib/reddit/errors')

const searchParams = Promise.resolve({})

beforeEach(() => {
  state.username = 'spez'
  state.me = { name: 'spez', icon: 'https://styles.redditmedia.com/avatar.png' }
  state.meError = false
  state.subscriptions = []
  state.multis = []
  state.listsError = null
})

describe('UserMenu', () => {
  it('opens a popover with account links, settings, and sign out', async () => {
    const out = await renderServer(<UserMenu />)
    expect(out).toContain('popoverTarget="user-menu"')
    expect(out).toContain('aria-label="Account menu for u/spez"')
    expect(out).toContain('src="https://styles.redditmedia.com/avatar.png"')
    for (const href of ['/user/spez', '/saved', '/multis', '/subreddits', '/settings']) {
      expect(out).toContain(`href="${href}"`)
    }
    expect(out).not.toContain('Blur NSFW media')
    expect(out).toContain('Sign out')
  })

  it('works without an avatar when Reddit is unavailable', async () => {
    state.meError = true
    const out = await renderServer(<UserMenu />)
    expect(out).toContain('class="avatarFallback"')
    expect(out).toContain('>S</span>')
  })

  it('renders nothing without a session, and has a skeleton', async () => {
    state.username = null
    expect(await renderServer(<UserMenu />)).toBe('')
    expect(await renderServer(<UserMenuSkeleton />)).toContain('skeleton')
  })
})

describe('Sidebar', () => {
  it('always links the main feeds', async () => {
    const out = await renderServer(<SidebarFeeds />)
    for (const href of ['/home', '/r/popular', '/r/all', '/saved'])
      expect(out).toContain(`href="${href}"`)
  })

  it('splits subscriptions into communities and people, with multis first', async () => {
    state.multis = [
      multiView(),
      multiView({ name: 'dev', displayName: 'Dev', href: '/m/dev', icon: null }),
    ]
    state.subscriptions = [
      subredditView(),
      subredditView({ name: 'nextjs', fullname: 't5_n', href: '/r/nextjs', icon: null }),
      subredditView({ name: 'spez', fullname: 't5_u', href: '/user/spez', kind: 'user' }),
    ]
    const out = await renderServer(<SidebarLists />)
    expect(out.indexOf('Multis')).toBeLessThan(out.indexOf('Communities'))
    expect(out).toContain('href="/m/news"')
    expect(out).toContain('r/<!-- -->nextjs')
    expect(out).toContain('aria-label="People"')
    expect(out).toContain('u/<!-- -->spez')
    expect(out).toContain('class="iconFallback"')
  })

  it('caps communities with a link to all of them, and has empty states', async () => {
    state.subscriptions = Array.from({ length: 51 }, (_, i) =>
      subredditView({ name: `sub${i}`, fullname: `t5_${i}`, href: `/r/sub${i}` }),
    )
    const many = await renderServer(<SidebarLists />)
    expect(many).toContain('All <!-- -->51<!-- --> communities →')
    expect(many).not.toContain('sub50<')
    state.subscriptions = []
    const none = await renderServer(<SidebarLists />)
    expect(none).toContain('No multis yet.')
    expect(none).toContain('You haven’t joined any communities.')
    expect(none).not.toContain('aria-label="People"')
  })

  it('renders nothing when Reddit refuses, and rethrows other failures', async () => {
    state.listsError = new errors.RedditForbiddenError('unknown')
    expect(await renderServer(<SidebarLists />)).toBe('')
    expect(await renderServer(<SidebarSkeleton />)).toContain('Loading your communities…')
  })
})

describe('AppLayout', () => {
  it('lays out header, search, drawer sidebar, and content', async () => {
    const out = await renderServer(
      <AppLayout params={Promise.resolve({})}>
        <p>content</p>
      </AppLayout>,
    )
    expect(out).toContain('popoverTarget="app-nav"')
    expect(out).toContain('<form role="search" class="search" action="/search" method="get">')
    expect(out).toContain('id="app-nav" popover="auto"')
    expect(out).toContain('<main class="main"><p>content</p></main>')
    expect(out).toContain('aria-label="Viewer for Reddit home"')
    expect(out).toContain('<a class="siteLink" href="/about">About</a>')
    expect(out).toContain('<a class="siteLink" href="/donate">Donate</a>')
    expect(out).toContain('href="https://github.com/gregrickaby/viewer-for-reddit"')
  })
})

describe('feed pages', () => {
  it('renders the home feed', async () => {
    expect(homeMetadata).toEqual({ title: 'Home' })
    const out = await renderServer(
      <HomePage params={Promise.resolve({})} searchParams={searchParams} />,
    )
    expect(out).toContain('<h1 class="title">Home</h1>')
    expect(out).toContain('<article')
  })

  it('renders a subreddit with its header and feed', async () => {
    const params = Promise.resolve({ subreddit: 'pics' })
    expect(await subredditPage.generateMetadata({ params, searchParams })).toEqual({
      title: 'r/pics',
    })
    const out = await renderServer(
      <subredditPage.default params={params} searchParams={searchParams} />,
    )
    expect(out).toContain('r/<!-- -->pics')
    expect(out).not.toContain('href="/r/pics" class="subreddit"')
    const popular = await renderServer(
      <subredditPage.default
        params={Promise.resolve({ subreddit: 'popular' })}
        searchParams={searchParams}
      />,
    )
    expect(popular).toContain('class="subreddit"')
  })

  it('renders the viewer’s own multi and someone else’s', async () => {
    const own = Promise.resolve({ multi: 'news' })
    expect(await ownMultiPage.generateMetadata({ params: own, searchParams })).toEqual({
      title: 'm/news',
    })
    const mine = await renderServer(
      <ownMultiPage.default params={own} searchParams={searchParams} />,
    )
    expect(mine).toContain('m/<!-- -->news')
    expect(mine).not.toContain('by u/')

    const theirs = Promise.resolve({ username: 'kn0thing', multi: 'tech' })
    expect(await userMultiPage.generateMetadata({ params: theirs, searchParams })).toEqual({
      title: 'm/tech by u/kn0thing',
    })
    const other = await renderServer(
      <userMultiPage.default params={theirs} searchParams={searchParams} />,
    )
    expect(other).toContain('by u/<!-- -->kn0thing')
  })

  it('renders nothing for /m/[multi] without a session', async () => {
    state.username = null
    const out = await renderServer(
      <ownMultiPage.default
        params={Promise.resolve({ multi: 'news' })}
        searchParams={searchParams}
      />,
    )
    expect(out).not.toContain('m/<!-- -->news')
  })
})

describe('SettingsMenu', () => {
  it('is a gear in the header with the theme and NSFW blur toggles', async () => {
    const out = await renderServer(<SettingsMenu />)
    expect(out).toContain('aria-label="Settings"')
    expect(out).toContain('popoverTarget="settings-menu"')
    expect(out).toContain('Dark mode')
    expect(out).toContain('Always dark')
    expect(out).toContain('aria-checked="true"')
    expect(out).toContain('Hides adult images and videos')
    expect(out).toContain('aria-checked="false"')
    expect(out).toContain('Blur NSFW media')
    expect(await renderServer(<SettingsMenuSkeleton />)).toContain('aria-hidden="true"')
  })
})

describe('settings and status pages', () => {
  it('shows both settings with their current values', async () => {
    expect(settingsMetadata).toEqual({ title: 'Settings' })
    const out = await renderServer(<SettingsPage />)
    expect(out).toContain('Dark mode')
    expect(out).toContain('Blur NSFW media')
  })

  it('has a friendly not-found page', async () => {
    expect(await renderServer(<NotFound />)).toContain('Reddit couldn’t find that.')
  })

  it('has a root not-found page for unknown addresses', async () => {
    expect(rootNotFound.metadata).toEqual({ title: 'Not found' })
    const out = await renderServer(<rootNotFound.default />)
    expect(out).toContain('This page doesn’t exist')
    // Not `/home`: this page can't tell whether the reader is signed in.
    expect(out).toMatch(/href="\/"[^>]*>Back to Home/)
    expect(out).not.toContain('href="/home"')
    // Framed like the public pages: a brand header linking home, and the site links.
    expect(out).toContain('<header')
    expect(out).toContain('aria-label="Viewer for Reddit home"')
    expect(out).toContain('<footer')
    expect(out).toContain('404')
    expect(out).toContain('About <!-- -->Viewer for Reddit')
  })
})
