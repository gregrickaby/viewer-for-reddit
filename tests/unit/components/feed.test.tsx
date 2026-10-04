import { type ReactElement, type ReactNode, isValidElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FeedSort } from '@/lib/url-state'
import type { Page, PostView } from '@/lib/view-models'
import { html, postView, subredditView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

const state = {
  page: { items: [] as PostView[], after: null as string | null, before: null as string | null },
  feedError: null as unknown,
  subredditError: null as unknown,
  blurNsfw: true,
}
const getFeed = vi.fn(async (): Promise<Page<PostView>> => {
  if (state.feedError) throw state.feedError
  return state.page
})
const getSubreddit = vi.fn(async (name: string) => {
  if (state.subredditError) throw state.subredditError
  return subredditView({ name })
})
const getMyMultis = vi.fn(async (): Promise<unknown[]> => [])
vi.mock('@/lib/reddit/reads', () => ({ getFeed, getSubreddit, getMyMultis }))
vi.mock('@/app/actions/multis', () => ({ setMembership: vi.fn() }))
vi.mock('@/app/actions/subscriptions', () => ({ setSubscription: vi.fn() }))
vi.mock('@/lib/settings', () => ({
  getSettings: vi.fn(async () => ({ theme: 'system', blurNsfw: state.blurNsfw })),
}))
vi.mock('@/lib/request-time', () => ({
  requestTime: vi.fn(async () => 1_700_000_000_000 + 3 * 3600_000),
}))
vi.mock('@/app/actions/things', () => ({ vote: vi.fn(), setSaved: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  unstable_rethrow: vi.fn(),
}))

const { PostCard, PostCardSkeleton } = await import('@/components/feed/post-card')
const { FeedSection, FeedSkeleton } = await import('@/components/feed/feed-section')
const { InfiniteFeed } = await import('@/components/islands/infinite-feed')
const { SubredditHeader, SubredditHeaderSkeleton, isPseudoSubreddit } =
  await import('@/components/subreddit/subreddit-header')
const { ForbiddenPanel } = await import('@/components/feed/forbidden-panel')
const errors = await import('@/lib/reddit/errors')
const { HOME_SORTS, LISTING_SORTS } = await import('@/lib/url-state')

const now = 1_700_000_000_000 + 3 * 3600_000
const card = (post: PostView, blurNsfw = true, showSubreddit = true) =>
  renderServer(<PostCard post={post} showSubreddit={showSubreddit} blurNsfw={blurNsfw} now={now} />)

beforeEach(() => {
  state.page = { items: [], after: null, before: null }
  state.feedError = null
  state.subredditError = null
  state.blurNsfw = true
})

describe('PostCard', () => {
  it('shows the essentials with forward links', async () => {
    const out = await card(postView())
    expect(out).toContain('href="/r/pics"')
    expect(out).toContain('href="/user/spez"')
    expect(out).toContain('>3h</time>')
    expect(out).toContain('title="Nov 14, 2023, 10:13 PM UTC"')
    expect(out).toContain('href="/r/pics/comments/abc/a_post"')
    expect(out).toContain('12<span class="narrowHidden"> comments</span>')
    expect(out).toContain('href="https://www.reddit.com/r/pics/comments/abc/a_post"')
    expect(out).toContain('aria-label="Upvote post, score 1,234"')
    expect(out).toContain('>1.2k</span>')
  })

  it('omits the subreddit on its own page and handles deleted authors', async () => {
    const out = await card(postView({ author: null }), true, false)
    expect(out).not.toContain('href="/r/pics"')
    expect(out).toContain('[deleted]')
  })

  it('shows badges, flair colors, and status', async () => {
    const out = await card(
      postView({
        distinguished: 'admin',
        flags: { nsfw: true, spoiler: true, stickied: true, locked: true, archived: false },
        flair: {
          text: 'Meta',
          parts: [{ kind: 'text', text: 'Meta' }],
          backgroundColor: '#ff4500',
          textColor: 'light',
        },
      }),
    )
    for (const text of ['Admin', 'Pinned', 'Locked', 'NSFW', 'Spoiler', 'Comments locked'])
      expect(out).toContain(text)
    expect(out).toContain('data-text="light" style="background-color:#ff4500"')
    const plain = await card(
      postView({
        distinguished: 'moderator',
        flair: {
          text: 'Tip',
          parts: [{ kind: 'text', text: 'Tip' }],
          backgroundColor: null,
          textColor: 'dark',
        },
        flags: { nsfw: false, spoiler: false, stickied: false, locked: false, archived: true },
      }),
    )
    expect(plain).toContain('>Mod<')
    expect(plain).toContain('<span class="flair">Tip</span>')
    const emoji = await card(
      postView({
        flair: {
          text: 'Funny:lul:',
          parts: [
            { kind: 'text', text: 'Funny' },
            { kind: 'emoji', name: 'lul', src: 'https://emoji.redditmedia.com/a/lul' },
          ],
          backgroundColor: null,
          textColor: 'dark',
        },
      }),
    )
    expect(emoji).toContain('Funny<img class="emoji" src="https://emoji.redditmedia.com/a/lul"')
    expect(emoji).toContain('alt="lul"')
    expect(emoji).not.toContain(':lul:')
    expect(plain).toContain('Archived')
    expect(plain).toMatch(/<button[^>]*disabled/)
  })

  it('blurs NSFW media only when the setting is on, and spoilers always', async () => {
    const media = {
      type: 'image' as const,
      image: { src: 'https://i.redd.it/a.jpg', srcSet: '', width: 1, height: 1, blurred: null },
    }
    const nsfw = postView({
      media,
      flags: { nsfw: true, spoiler: false, stickied: false, locked: false, archived: false },
    })
    expect(await card(nsfw, true)).toContain('<details class="reveal">')
    expect(await card(nsfw, false)).not.toContain('<details class="reveal">')
    const spoiler = postView({
      media,
      flags: { nsfw: false, spoiler: true, stickied: false, locked: false, archived: false },
    })
    expect(await card(spoiler, false)).toContain('<details class="reveal">')
  })

  it('puts self text with inline media behind the same reveal', async () => {
    const inline = html(
      '<p><span data-inline-media><a href="https://i.redd.it/a.jpg"><img src="https://i.redd.it/a.jpg"></a></span></p>',
    )
    const flags = { nsfw: true, spoiler: false, stickied: false, locked: false, archived: false }
    const hidden = await card(postView({ media: { type: 'none' }, body: inline, flags }))
    expect(hidden).toMatch(/<details class="reveal">.*<img src="https:\/\/i\.redd\.it\/a\.jpg">/)
    expect(
      await card(postView({ media: { type: 'none' }, body: inline, flags }), false),
    ).not.toContain('<details class="reveal">')
    // Plain text isn't media: it stays readable.
    const text = await card(postView({ media: { type: 'none' }, body: html('<p>Hi</p>'), flags }))
    expect(text).not.toContain('<details class="reveal">')
  })

  it('clamps long self text behind "Read more" and shows short text whole', async () => {
    const long = await card(postView({ body: html(`<p>${'word '.repeat(300)}</p>`) }))
    expect(long).toContain('<summary>Read more</summary>')
    const short = await card(postView({ body: html('<p>Short</p>') }))
    expect(short).toContain('<p>Short</p>')
    expect(short).not.toContain('Read more')
  })

  it('credits crossposts and explains removals', async () => {
    const out = await card(
      postView({
        crosspostFrom: { subreddit: 'aww', author: 'x', permalink: '/r/aww/comments/zz/t' },
        removal: 'deleted',
      }),
    )
    expect(out).toContain('Crossposted from<!-- --> <a href="/r/aww/comments/zz/t"')
    expect(out).toContain('Deleted by its author.')
    expect(await card(postView({ removal: 'removed' }))).toContain('Removed.')
  })

  it('has a matching skeleton', async () => {
    expect(await renderServer(<PostCardSkeleton />)).toContain('aria-hidden="true"')
  })
})

describe('FeedSection', () => {
  const section = (
    params: Record<string, string>,
    sorts: readonly FeedSort[] = HOME_SORTS,
    base = '/home',
  ) =>
    renderServer(
      <FeedSection
        source={{ type: 'home' }}
        base={base}
        sorts={sorts}
        searchParams={Promise.resolve(params)}
        showSubreddit
      />,
    )

  it('lists posts with tabs and a Next link', async () => {
    state.page = {
      items: [postView(), postView({ id: 'def', fullname: 't3_def' })],
      after: 't3_def',
      before: null,
    }
    const out = await section({})
    expect(getFeed).toHaveBeenLastCalledWith(
      { type: 'home' },
      expect.objectContaining({ sort: 'best' }),
    )
    expect(out.match(/<article/g)).toHaveLength(2)
    expect(out).toContain('aria-current="page"')
    expect(out).toContain('href="/home?after=t3_def&amp;count=25"')
    expect(out).not.toContain('rel="prev"')
    // The island loads the next page; the link is only for readers without JavaScript.
    expect(out).toContain('<noscript><nav')
  })

  it('restarts the infinite feed when the blur setting changes', async () => {
    const infiniteKey = (node: ReactNode): string | null => {
      if (!isValidElement<{ children?: ReactNode }>(node)) {
        return Array.isArray(node) ? (node.map(infiniteKey).find(Boolean) ?? null) : null
      }
      if (node.type === InfiniteFeed) return String((node as ReactElement).key)
      return infiniteKey(node.props.children)
    }
    state.page = { items: [postView()], after: 't3_x', before: null }
    const props = {
      source: { type: 'home' },
      base: '/home',
      sorts: HOME_SORTS,
      searchParams: Promise.resolve({}),
      showSubreddit: true,
    } as const
    state.blurNsfw = true
    const blurred = infiniteKey(await FeedSection(props))
    state.blurNsfw = false
    const revealed = infiniteKey(await FeedSection(props))
    expect(blurred).toBeTruthy()
    expect(revealed).toBeTruthy()
    expect(blurred).not.toBe(revealed)
  })

  it('keeps Previous in view and puts only Next behind noscript', async () => {
    state.page = { items: [postView()], after: 't3_x', before: 't3_abc' }
    const out = await section({ after: 't3_x', count: '50' })
    expect(out).toContain('rel="prev"')
    expect(out).toContain('<noscript><a')
    expect(out).not.toContain('<noscript><nav')
  })

  it('offers Previous past the first page and ends when there is no cursor', async () => {
    state.page = { items: [postView()], after: null, before: 't3_abc' }
    const out = await section({ after: 't3_x', count: '50' })
    expect(out).toContain('href="/home?before=t3_abc&amp;count=51"')
    expect(out).not.toContain('rel="next"')
  })

  it('says when the end is reached, and when there is nothing at all', async () => {
    state.page = { items: [postView()], after: null, before: null }
    expect(await section({})).toContain('You’ve reached the end.')
    state.page = { items: [], after: null, before: null }
    const empty = await section({})
    expect(empty).toContain('Nothing here yet')
    expect(empty).not.toContain('reached the end')
  })

  it('shows the time-range menu for Top', async () => {
    state.page = { items: [postView()], after: null, before: null }
    const out = await section({ sort: 'top', t: 'week' }, LISTING_SORTS, '/r/pics')
    expect(out).toContain('This week<span aria-hidden="true">▾</span>')
    expect(out).toContain('popover="auto"')
    expect(out).toContain('href="/r/pics?sort=top&amp;t=all"')
  })

  it('shows why a community is off limits', async () => {
    state.feedError = new errors.RedditForbiddenError('quarantined')
    expect(await section({})).toContain('This community is quarantined')
  })

  it('has a busy skeleton', async () => {
    const out = await renderServer(<FeedSkeleton />)
    expect(out).toContain('aria-busy="true"')
    expect(out).toContain('Loading posts…')
  })
})

describe('ForbiddenPanel', () => {
  it.each(['private', 'banned', 'gold_only', 'unknown'] as const)('explains %s', async (reason) => {
    expect(await renderServer(<ForbiddenPanel reason={reason} />)).toContain('class="noticeTitle"')
  })
})

describe('SubredditHeader', () => {
  const header = (name: string) =>
    renderServer(<SubredditHeader params={Promise.resolve({ subreddit: name })} />)

  it('shows the banner, icon, name, and members', async () => {
    const out = await header('pics')
    expect(out).toContain(
      'background-image:url(&quot;https://styles.redditmedia.com/banner.png&quot;)',
    )
    expect(out).toContain('<h1 class="title">r/<!-- -->pics</h1>')
    expect(out).toContain('33.5m<!-- --> members')
    expect(out).toContain('<p>Pictures</p>')
  })

  it('falls back when the community has no icon, banner, or stats', async () => {
    getSubreddit.mockResolvedValueOnce(
      subredditView({
        icon: null,
        banner: null,
        color: null,
        subscribers: null,
        description: null,
        title: '',
        nsfw: true,
      }),
    )
    const out = await header('bare')
    expect(out).toContain('class="iconFallback"')
    expect(out).not.toContain('background-image')
    expect(out).not.toContain('members')
    expect(out).toContain('NSFW')
  })

  it('offers + Multi when the multis load, and still works when they don’t', async () => {
    expect(await header('pics')).toContain('aria-label="Add r/pics to a multireddit"')
    getMyMultis.mockRejectedValueOnce(new Error('rate limited'))
    const out = await header('pics')
    expect(out).toContain('<h1 class="title">r/<!-- -->pics</h1>')
    expect(out).not.toContain('to a multireddit')
  })

  it('keeps r/popular and r/all as plain titles without calling Reddit', async () => {
    getSubreddit.mockClear()
    expect(await header('Popular')).toContain('r/popular')
    expect(getSubreddit).not.toHaveBeenCalled()
    expect(isPseudoSubreddit('ALL')).toBe(true)
  })

  it('names a forbidden community and 404s a missing one', async () => {
    state.subredditError = new errors.RedditForbiddenError('private')
    expect(await header('secret')).toContain('<h1 class="title">r/secret</h1>')
    state.subredditError = new errors.RedditNotFoundError()
    await expect(header('gone')).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('has a skeleton', async () => {
    expect(await renderServer(<SubredditHeaderSkeleton />)).toContain('Loading community…')
  })
})
