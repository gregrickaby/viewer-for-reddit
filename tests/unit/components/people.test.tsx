import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommentView, ListItem, Page, ProfileView, SubredditView } from '@/lib/view-models'
import { html, multiView, postView, subredditView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

function commentView(overrides: Partial<CommentView> = {}): CommentView {
  return {
    id: 'c1',
    fullname: 't1_c1',
    author: 'alice',
    body: html('<p>Nice</p>'),
    createdUtc: 1_700_000_000,
    editedUtc: null,
    score: 5,
    scoreHidden: false,
    likes: 1,
    saved: true,
    flags: {
      stickied: false,
      locked: false,
      archived: false,
      isSubmitter: false,
      collapsed: false,
    },
    distinguished: null,
    removal: null,
    flair: null,
    permalink: '/r/pics/comments/abc/a_post/c1',
    depth: 0,
    context: {
      postTitle: 'A post',
      postPermalink: '/r/pics/comments/abc/a_post',
      subreddit: 'pics',
    },
    mine: false,
    bodyMarkdown: null,
    ...overrides,
  }
}

const state = {
  saved: { items: [] as ListItem[], after: null as string | null, before: null },
  listing: { items: [] as ListItem[], after: null as string | null, before: null },
  profile: null as ProfileView | null,
  profileError: null as unknown,
  listingError: null as unknown,
  subscriptions: [] as SubredditView[],
  search: { items: [] as SubredditView[], after: null as string | null, before: null },
  viewer: 'spez' as string | null,
  multisError: false,
}

const getSaved = vi.fn(async (): Promise<Page<ListItem>> => state.saved)
const getUserListing = vi.fn(async (): Promise<Page<ListItem>> => {
  if (state.listingError) throw state.listingError
  return state.listing
})
const getProfile = vi.fn(async () => {
  if (state.profileError) throw state.profileError
  return state.profile!
})
const searchSubreddits = vi.fn(async () => state.search)
vi.mock('@/lib/reddit/people', () => ({ getSaved, getUserListing, getProfile, searchSubreddits }))
vi.mock('@/lib/reddit/reads', () => ({
  getMySubscriptions: vi.fn(async () => state.subscriptions),
  getMyMultis: vi.fn(async () => {
    if (state.multisError) throw new Error('down')
    return [multiView()]
  }),
}))
vi.mock('@/app/actions/multis', () => ({ setMembership: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ getUsername: vi.fn(async () => state.viewer) }))
vi.mock('@/app/actions/settings', () => ({ setBlurNsfw: vi.fn() }))
vi.mock('@/lib/settings', () => ({
  getSettings: vi.fn(async () => ({ theme: 'system', blurNsfw: true })),
}))
vi.mock('@/lib/request-time', () => ({ requestTime: vi.fn(async () => 1_700_003_600_000) }))
vi.mock('@/app/actions/things', () => ({ vote: vi.fn(), setSaved: vi.fn() }))
vi.mock('@/app/actions/subscriptions', () => ({ setSubscription: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  unstable_rethrow: vi.fn(),
}))

const { CommentCard } = await import('@/components/feed/comment-card')
const { ItemList, firstFullname } = await import('@/components/feed/item-list')
const { Tabs } = await import('@/components/ui/tabs')
const { ProfileHeader, ProfileHeaderSkeleton } = await import('@/components/profile/profile-header')
const { SubredditRows, SubredditRowsSkeleton } =
  await import('@/components/subreddit/subreddit-row')
const savedPage = await import('@/app/(app)/saved/page')
const profilePage = await import('@/app/(app)/user/[username]/page')
const subscriptionsPage = await import('@/app/(app)/subreddits/page')
const searchPage = await import('@/app/(app)/search/page')
const errors = await import('@/lib/reddit/errors')

const now = 1_700_003_600_000
const user = {
  name: 'kn0thing',
  fullname: 't2_1' as const,
  icon: 'https://styles.redditmedia.com/a.png',
  karma: { total: 12_500, post: 10_000, comment: 2_500 },
  createdUtc: 1_118_000_000,
  verified: true,
  premium: false,
  followed: false,
  bio: 'Co-founder',
  nsfw: false,
}
const search = (value: Record<string, string>) => Promise.resolve(value)

beforeEach(() => {
  state.saved = { items: [], after: null, before: null }
  state.listing = { items: [], after: null, before: null }
  state.profile = { kind: 'active', user }
  state.profileError = null
  state.listingError = null
  state.subscriptions = []
  state.search = { items: [], after: null, before: null }
  state.viewer = 'spez'
  state.multisError = false
})

describe('CommentCard', () => {
  it('shows the post it belongs to and a context link', async () => {
    const out = await renderServer(<CommentCard comment={commentView()} now={now} />)
    expect(out).toContain('href="/r/pics/comments/abc/a_post"')
    expect(out).toContain('r/<!-- -->pics')
    expect(out).toContain('href="/user/alice"')
    expect(out).toContain('<p>Nice</p>')
    expect(out).toContain('View context')
    expect(out).toContain('aria-pressed="true"')
  })

  it('handles missing context, deleted authors, and removed bodies', async () => {
    const deleted = await renderServer(
      <CommentCard
        comment={commentView({ context: null, author: null, body: null, removal: 'deleted' })}
        now={now}
      />,
    )
    expect(deleted).toContain('[deleted]')
    expect(deleted).toContain('Deleted by its author.')
    const removed = await renderServer(
      <CommentCard comment={commentView({ body: null, removal: 'removed' })} now={now} />,
    )
    expect(removed).toContain('Removed.')
  })
})

describe('ItemList', () => {
  const items: ListItem[] = [
    { kind: 'post', post: postView() },
    { kind: 'comment', comment: commentView() },
  ]

  it('renders posts and comments in order', async () => {
    const out = await renderServer(
      <ItemList items={items} now={now} blurNsfw empty={{ title: 'x', detail: 'y' }} />,
    )
    expect(out.indexOf('post-abc-title')).toBeLessThan(out.indexOf('View context'))
    expect(firstFullname(items)).toBe('t3_abc')
    expect(firstFullname([items[1]!])).toBe('t1_c1')
    expect(firstFullname([])).toBeUndefined()
  })

  it('has an empty state', async () => {
    const out = await renderServer(
      <ItemList items={[]} now={now} blurNsfw empty={{ title: 'Empty', detail: 'None' }} />,
    )
    expect(out).toContain('Empty')
  })
})

describe('Tabs', () => {
  it('marks the current tab', async () => {
    const out = await renderServer(
      <Tabs
        label="Kinds"
        tabs={[
          { href: '/a', label: 'A', current: true },
          { href: '/b', label: 'B', current: false },
        ]}
      />,
    )
    expect(out).toContain('aria-label="Kinds"')
    expect(out).toMatch(/aria-current="page" href="\/a"|href="\/a"[^>]*aria-current="page"/)
  })
})

describe('ProfileHeader', () => {
  it('shows karma, cake day, bio, and Follow', async () => {
    const out = await renderServer(
      <ProfileHeader profile={{ kind: 'active', user }} viewer="spez" />,
    )
    expect(out).toContain('u/<!-- -->kn0thing')
    expect(out).toContain('12.5k<!-- --> karma')
    expect(out).toContain('Cake day <!-- -->June 5, 2005')
    expect(out).toContain('Co-founder')
    expect(out).toContain('Follow')
  })

  it('hides Follow on your own profile and falls back without an avatar', async () => {
    const out = await renderServer(
      <ProfileHeader
        profile={{ kind: 'active', user: { ...user, icon: null, bio: null, nsfw: true } }}
        viewer="KN0THING"
      />,
    )
    expect(out).not.toContain('Follow')
    expect(out).toContain('class="avatarFallback"')
    expect(out).toContain('NSFW')
  })

  it('explains suspended accounts', async () => {
    const out = await renderServer(
      <ProfileHeader profile={{ kind: 'suspended', name: 'gone' }} viewer={null} />,
    )
    expect(out).toContain('This account has been suspended by Reddit.')
    expect(await renderServer(<ProfileHeaderSkeleton />)).toContain('Loading profile…')
  })
})

describe('SubredditRows', () => {
  it('lists communities and people with their buttons', async () => {
    const out = await renderServer(
      <SubredditRows
        items={[
          subredditView({ title: 'Reddit Pics' }),
          subredditView({
            name: 'spez',
            fullname: 't5_u',
            href: '/user/spez',
            kind: 'user',
            icon: null,
            subscribers: null,
            nsfw: true,
          }),
        ]}
        showDescription
        confirmLeave
      />,
    )
    expect(out).toContain('r/<!-- -->pics')
    expect(out).toContain('33.5m<!-- --> members')
    expect(out).toContain('Reddit Pics')
    expect(out).toContain('<p>Pictures</p>')
    expect(out).toContain('u/<!-- -->spez')
    expect(out).toContain('Leave<!-- --> <!-- -->r/pics<!-- -->?')
    expect(out).toContain('Unfollow<!-- --> <!-- -->u/spez<!-- -->?')
    expect(await renderServer(<SubredditRowsSkeleton />)).toContain('aria-busy="true"')
  })
})

describe('/saved', () => {
  it('lists saved items with type tabs and paging that keeps the type', async () => {
    state.saved = {
      items: [{ kind: 'comment', comment: commentView() }],
      after: 't1_next',
      before: null,
    }
    expect(savedPage.metadata).toEqual({ title: 'Saved' })
    const out = await renderServer(
      <savedPage.default
        params={Promise.resolve({})}
        searchParams={search({ type: 'comments' })}
      />,
    )
    expect(getSaved).toHaveBeenLastCalledWith('comments', expect.objectContaining({ sort: 'new' }))
    expect(out).toContain('href="/saved?type=links"')
    expect(out).toContain('href="/saved?type=comments&amp;after=t1_next&amp;count=25"')
    state.saved = { items: [], after: null, before: null }
    const empty = await renderServer(
      <savedPage.default params={Promise.resolve({})} searchParams={search({})} />,
    )
    expect(empty).toContain('Nothing saved yet')
  })
})

describe('/user/[username]', () => {
  const params = Promise.resolve({ username: 'kn0thing' })

  it('renders the header, tabs, sorts, and activity', async () => {
    state.listing = { items: [{ kind: 'post', post: postView() }], after: 't3_next', before: null }
    expect(await profilePage.generateMetadata({ params, searchParams: search({}) })).toEqual({
      title: 'u/kn0thing',
    })
    const out = await renderServer(
      <profilePage.default
        params={params}
        searchParams={search({ tab: 'submitted', sort: 'top', t: 'week' })}
      />,
    )
    expect(getUserListing).toHaveBeenLastCalledWith(
      'kn0thing',
      'submitted',
      expect.objectContaining({ sort: 'top', t: 'week' }),
    )
    expect(out).toContain('Cake day')
    expect(out).toContain('href="/user/kn0thing?tab=comments"')
    expect(out).toContain('href="/user/kn0thing?tab=submitted&amp;sort=hot"')
    expect(out).toContain(
      'href="/user/kn0thing?tab=submitted&amp;sort=top&amp;t=week&amp;after=t3_next&amp;count=25"',
    )
  })

  it('degrades when Reddit refuses the profile or its activity', async () => {
    state.profileError = new errors.RedditForbiddenError('unknown')
    state.listingError = new errors.RedditForbiddenError('unknown')
    const out = await renderServer(
      <profilePage.default params={params} searchParams={search({})} />,
    )
    expect(out).not.toContain('Cake day')
    expect(out).toContain('Reddit won’t show this profile’s activity')
  })
})

describe('/subreddits', () => {
  beforeEach(() => {
    state.subscriptions = [
      subredditView({
        name: 'programming',
        fullname: 't5_a',
        href: '/r/programming',
        title: 'Programming',
      }),
      subredditView({ name: 'pics', fullname: 't5_b', title: 'Reddit Pics' }),
      subredditView({
        name: 'spez',
        fullname: 't5_u',
        href: '/user/spez',
        kind: 'user',
        title: 'spez',
      }),
    ]
  })

  it('lists communities with counts, confirming before leaving', async () => {
    expect(subscriptionsPage.metadata).toEqual({ title: 'Subscriptions' })
    const out = await renderServer(
      <subscriptionsPage.default params={Promise.resolve({})} searchParams={search({})} />,
    )
    expect(out).toContain('Communities (2)')
    expect(out).toContain('People (1)')
    expect(out).toContain('r/<!-- -->programming')
    expect(out).not.toContain('u/<!-- -->spez')
    expect(out).toContain('Leave<!-- --> <!-- -->r/programming<!-- -->?')
  })

  it('filters by name or title, and switches to people', async () => {
    const filtered = await renderServer(
      <subscriptionsPage.default
        params={Promise.resolve({})}
        searchParams={search({ q: 'PICS' })}
      />,
    )
    expect(filtered).toContain('r/<!-- -->pics')
    expect(filtered).not.toContain('r/<!-- -->programming')
    expect(filtered).toContain('href="/subreddits?tab=people&amp;q=PICS"')
    const people = await renderServer(
      <subscriptionsPage.default
        params={Promise.resolve({})}
        searchParams={search({ tab: 'people' })}
      />,
    )
    expect(people).toContain('u/<!-- -->spez')
    expect(people).toContain('<input type="hidden" name="tab" value="people"/>')
  })

  it('explains empty results', async () => {
    const none = await renderServer(
      <subscriptionsPage.default
        params={Promise.resolve({})}
        searchParams={search({ q: 'zzz' })}
      />,
    )
    expect(none).toContain('No matches for “zzz”')
    state.subscriptions = []
    const empty = await renderServer(
      <subscriptionsPage.default
        params={Promise.resolve({})}
        searchParams={search({ tab: 'people' })}
      />,
    )
    expect(empty).toContain('No people yet')
  })
})

describe('/search', () => {
  it('invites a search when there is no query', async () => {
    expect(searchPage.metadata).toEqual({ title: 'Search' })
    const out = await renderServer(
      <searchPage.default params={Promise.resolve({})} searchParams={search({})} />,
    )
    expect(out).toContain('Find communities')
    expect(searchSubreddits).not.toHaveBeenCalled()
  })

  it('shows results with paging that keeps the query', async () => {
    state.search = {
      items: [subredditView({ name: 'typescript', fullname: 't5_ts', href: '/r/typescript' })],
      after: 't5_ts',
      before: null,
    }
    const out = await renderServer(
      <searchPage.default
        params={Promise.resolve({})}
        searchParams={search({ q: 'typescript' })}
      />,
    )
    expect(searchSubreddits).toHaveBeenLastCalledWith('typescript', expect.any(Object))
    expect(out).toContain('value="typescript"')
    expect(out).toContain('r/<!-- -->typescript')
    expect(out).toContain('href="/search?q=typescript&amp;after=t5_ts&amp;count=25"')
    expect(out).toContain('aria-label="Add r/typescript to a multireddit"')
  })

  it('still shows results when multis fail to load', async () => {
    state.multisError = true
    state.search = {
      items: [subredditView({ name: 'typescript', fullname: 't5_ts', href: '/r/typescript' })],
      after: null,
      before: null,
    }
    const out = await renderServer(
      <searchPage.default
        params={Promise.resolve({})}
        searchParams={search({ q: 'typescript' })}
      />,
    )
    expect(out).toContain('r/<!-- -->typescript')
    expect(out).not.toContain('to a multireddit')
  })

  it('says when nothing matches', async () => {
    const out = await renderServer(
      <searchPage.default params={Promise.resolve({})} searchParams={search({ q: 'zzz' })} />,
    )
    expect(out).toContain('No communities match “<!-- -->zzz<!-- -->”')
  })
})
