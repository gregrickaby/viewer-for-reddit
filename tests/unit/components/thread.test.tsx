import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommentNode, CommentView, ThreadView } from '@/lib/view-models'
import { html, postView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

const state = {
  thread: null as ThreadView | null,
  error: null as unknown,
  username: 'spez' as string | null,
}
const getThread = vi.fn(async () => {
  if (state.error) throw state.error
  return state.thread!
})
vi.mock('@/lib/reddit/thread', () => ({ getThread }))
vi.mock('@/lib/auth/session', () => ({ getUsername: vi.fn(async () => state.username) }))
vi.mock('@/app/actions/settings', () => ({ setBlurNsfw: vi.fn() }))
vi.mock('@/lib/settings', () => ({
  getSettings: vi.fn(async () => ({ theme: 'system', blurNsfw: true })),
}))
vi.mock('@/lib/request-time', () => ({ requestTime: vi.fn(async () => 1_700_003_600_000) }))
vi.mock('@/app/actions/things', () => ({ vote: vi.fn(), setSaved: vi.fn() }))
vi.mock('@/app/actions/comments', () => ({
  postComment: vi.fn(),
  editComment: vi.fn(),
  deleteComment: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  unstable_rethrow: vi.fn(),
}))

const { CommentTree, CommentTreeSkeleton } = await import('@/components/thread/comment-tree')
const { ThreadSection, ThreadSkeleton } = await import('@/components/thread/thread-section')
const postPage = await import('@/app/(app)/r/[subreddit]/comments/[id]/[[...rest]]/page')
const errors = await import('@/lib/reddit/errors')
const { parseThreadQuery } = await import('@/lib/url-state')

function commentView(overrides: Partial<CommentView> = {}): CommentView {
  return {
    id: 'c1',
    fullname: 't1_c1',
    author: 'alice',
    body: html('<p>Hello</p>'),
    createdUtc: 1_700_000_000,
    editedUtc: null,
    score: 42,
    scoreHidden: false,
    likes: 0,
    saved: false,
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
    context: null,
    mine: false,
    bodyMarkdown: null,
    ...overrides,
  }
}
const node = (comment: CommentView, replies: CommentNode[] = []): CommentNode => ({
  kind: 'comment',
  comment,
  replies,
})
const more = (overrides: Partial<Extract<CommentNode, { kind: 'more' }>>): CommentNode => ({
  kind: 'more',
  id: 'm1',
  parentId: 't1_c1',
  depth: 1,
  count: 3,
  children: ['x', 'y', 'z'],
  ...overrides,
})

const ctx = {
  postPath: '/r/pics/comments/abc/a_post',
  threadBase: '/r/pics/comments/abc/a_post',
  query: parseThreadQuery({}),
  now: 1_700_003_600_000,
  me: 'spez',
  readOnly: false,
  focusCommentId: null as string | null,
}
const tree = (nodes: CommentNode[], overrides: Partial<typeof ctx> = {}) =>
  renderServer(<CommentTree nodes={nodes} ctx={{ ...ctx, ...overrides }} />)

beforeEach(() => {
  state.thread = { post: postView(), comments: [node(commentView())], focusCommentId: null }
  state.error = null
  state.username = 'spez'
})

describe('CommentTree', () => {
  it('renders a collapsible comment with its actions', async () => {
    const out = await tree([node(commentView())])
    expect(out).toContain('<article id="c-c1"')
    expect(out).toContain('<details open="" class="details">')
    expect(out).toContain('u/alice')
    expect(out).toContain('>1h</time>')
    expect(out).toContain('<p>Hello</p>')
    expect(out).toContain('aria-label="Upvote comment, score 42"')
    expect(out).toContain('<summary class="action">Reply</summary>')
    expect(out).not.toContain('Edit')
    expect(out).not.toContain('Delete')
    expect(out).toContain('href="/r/pics/comments/abc/a_post/c1"')
  })

  it('shows badges, edits, collapse state, and nested replies', async () => {
    const out = await tree([
      node(
        commentView({
          flags: {
            stickied: true,
            locked: false,
            archived: false,
            isSubmitter: true,
            collapsed: true,
          },
          distinguished: 'moderator',
          flair: { text: 'Expert', backgroundColor: null, textColor: 'dark' },
          editedUtc: 1_700_000_100,
        }),
        [node(commentView({ id: 'c2', fullname: 't1_c2', distinguished: 'admin' }))],
      ),
    ])
    expect(out).toContain('<details class="details">')
    for (const text of ['OP', 'Mod', 'Admin', 'Expert', 'edited', 'Pinned'])
      expect(out).toContain(text)
    expect(out).toContain('id="c-c2"')
  })

  it('offers edit and a delete confirm on your own comments', async () => {
    const out = await tree([node(commentView({ mine: true, bodyMarkdown: 'Hello' }))])
    expect(out).toContain('<summary class="action">Edit</summary>')
    expect(out).toContain('>Hello</textarea>')
    expect(out).toMatch(/popoverTarget="[^"]+">Delete<\/button>/)
    expect(out).toContain('Delete this comment? This can’t be undone.')
    expect(out).toContain('popoverTargetAction="hide"')
  })

  it('mutes deleted and removed comments but keeps their replies', async () => {
    const out = await tree([
      node(commentView({ author: null, body: null, removal: 'deleted' }), [
        node(commentView({ id: 'c2' })),
      ]),
      node(commentView({ id: 'c3', body: null, removal: 'removed' })),
    ])
    expect(out).toContain('[deleted]')
    expect(out).toContain('Deleted by its author.')
    expect(out).toContain('Removed.')
    expect(out).toContain('id="c-c2"')
    // Only the live reply (c2) can be answered.
    expect(out.match(/>Reply<\/summary>/g)).toHaveLength(1)
  })

  it('disables voting and replies on read-only threads', async () => {
    const out = await tree([node(commentView())], { readOnly: true })
    expect(out).not.toContain('>Reply</summary>')
    expect(out).toMatch(/<button[^>]*disabled/)
  })

  it('links "load more" in place, anchored to the parent', async () => {
    const out = await tree([node(commentView(), [more({ count: 1, children: ['x'] })])])
    expect(out).toContain('href="/r/pics/comments/abc/a_post?more=m1#c-c1"')
    expect(out).toContain('Load <!-- -->1<!-- --> more <!-- -->reply')
    const top = await tree([more({ parentId: 't3_abc' })])
    expect(top).toContain('#comments"')
    expect(top).toContain('replies')
  })

  it('continues deep threads on their own page', async () => {
    const out = await tree([node(commentView(), [more({ count: 0, children: [] })])])
    expect(out).toContain('href="/r/pics/comments/abc/a_post/c1"')
    expect(out).toContain('Continue this thread →')
  })

  it('falls back to continuing the thread past the expansion cap, and skips it at the top level', async () => {
    const full = parseThreadQuery({
      more: Array.from({ length: 20 }, (_, i) => `m${i}x`).join(','),
    })
    expect(await tree([more({})], { query: full })).toContain('Continue this thread →')
    expect(await tree([more({ parentId: 't3_abc', count: 0, children: [] })])).toBe(
      '<ol role="list" class="tree"><li></li></ol>',
    )
  })

  it('highlights the focused comment', async () => {
    expect(await tree([node(commentView())], { focusCommentId: 'c1' })).toContain('data-focus=""')
  })

  it('has a skeleton', async () => {
    expect(await renderServer(<CommentTreeSkeleton />)).toContain('Loading comments…')
  })
})

describe('ThreadSection', () => {
  const section = (rest?: string[], search: Record<string, string> = {}) =>
    renderServer(
      <ThreadSection
        params={Promise.resolve({ subreddit: 'pics', id: 'abc', rest })}
        searchParams={Promise.resolve(search)}
      />,
    )

  it('renders the post, sorts, a composer, and the tree', async () => {
    const out = await section(['a_post'])
    expect(getThread).toHaveBeenLastCalledWith({
      id: 'abc',
      query: { sort: 'confidence', more: [] },
      focusCommentId: null,
    })
    expect(out).toContain('← r/<!-- -->pics')
    expect(out).toContain('<h1 id="post-abc-title"')
    expect(out).toContain('href="#comments"')
    expect(out).toContain('12 comments</h2>')
    expect(out).toContain('href="/r/pics/comments/abc/a_post?sort=qa"')
    expect(out).toContain('placeholder="What are your thoughts?"')
    expect(out).toContain('id="c-c1"')
  })

  it('shows the single-thread banner and passes the focus id', async () => {
    state.thread = { ...state.thread!, focusCommentId: 'c1' }
    const out = await section(['a_post', 'c1'], { sort: 'new' })
    expect(getThread).toHaveBeenLastCalledWith(expect.objectContaining({ focusCommentId: 'c1' }))
    expect(out).toContain('You’re viewing a single comment thread.')
    expect(out).toContain('href="/r/pics/comments/abc/a_post/c1?sort=top"')
  })

  it.each([
    [{ archived: true, locked: false }, 'This thread is archived.'],
    [{ archived: false, locked: true }, 'Comments are locked.'],
  ])('explains read-only threads and hides the composer (%o)', async (flags, text) => {
    state.thread = {
      post: postView({ flags: { nsfw: false, spoiler: false, stickied: false, ...flags } }),
      comments: [],
      focusCommentId: null,
    }
    const out = await section()
    expect(out).toContain(text)
    expect(out).not.toContain('What are your thoughts?')
    expect(out).toContain('No comments yet.')
  })

  it('hides the composer without a session, and shows forbidden threads', async () => {
    state.username = null
    expect(await section()).not.toContain('What are your thoughts?')
    state.error = new errors.RedditForbiddenError('private')
    expect(await section()).toContain('This community is private')
  })

  it('has a skeleton', async () => {
    expect(await renderServer(<ThreadSkeleton />)).toContain('Loading comments…')
  })
})

describe('post page', () => {
  it('titles itself from the slug and renders the thread', async () => {
    const params = Promise.resolve({ subreddit: 'pics', id: 'abc', rest: ['a_great_post'] })
    const searchParams = Promise.resolve({})
    expect(await postPage.generateMetadata({ params, searchParams })).toEqual({
      title: 'a great post · r/pics',
    })
    expect(
      await postPage.generateMetadata({
        params: Promise.resolve({ subreddit: 'pics', id: 'abc' }),
        searchParams,
      }),
    ).toEqual({ title: 'r/pics' })
    expect(
      await renderServer(<postPage.default params={params} searchParams={searchParams} />),
    ).toContain('id="comments"')
  })
})
