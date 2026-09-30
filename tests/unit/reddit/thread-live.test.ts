import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommentNode } from '@/lib/view-models'
import { sample, samples } from '@/tests/helpers/fixtures'

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'fixture_user' })),
}))

const { bodyHashOf, clearThreadCache, cursorFromTree, pollThread } =
  await import('@/lib/reddit/thread-live')
const session = await import('@/lib/auth/session')
const { RedditNotFoundError } = await import('@/lib/reddit/errors')

const post = sample('Link', (v) => v.is_self === true && !v.removed_by_category)
const [template] = samples('Comment')

const listing = (children: unknown[]) => ({
  kind: 'Listing',
  data: { after: null, before: null, children },
})

/** A comment at `created`, replying to `parent` (a fullname), with optional nested replies. */
function comment(
  id: string,
  created: number,
  parent = 't3_post',
  replies: unknown[] = [],
  author = `author_${id}`,
) {
  return {
    kind: 't1',
    data: {
      ...template,
      id,
      name: `t1_${id}`,
      author,
      created_utc: created,
      parent_id: parent,
      replies: replies.length > 0 ? listing(replies) : '',
    },
  }
}

const respond = (...comments: unknown[]) =>
  redditFetch.mockResolvedValue([listing([{ kind: 't3', data: post }]), listing(comments)])

const ID = 'abc123'

beforeEach(() => {
  redditFetch.mockReset()
  clearThreadCache()
})

describe('pollThread', () => {
  it('asks for the newest comments, replies included', async () => {
    respond()
    await pollThread(ID, { since: 0, seen: [] })
    expect(redditFetch).toHaveBeenCalledWith(`/comments/${ID}`, {
      token: 'tok',
      query: { sort: 'new', limit: 100, depth: 8 },
    })
  })

  it('returns what is newer than the cursor, newest first, replies included', async () => {
    respond(
      comment('c', 130, 't3_post', [comment('d', 140, 't1_c')]),
      comment('b', 120),
      comment('a', 100),
    )
    const poll = await pollThread(ID, { since: 110, seen: [] })
    expect(poll.comments.map((each) => each.comment.id)).toEqual(['d', 'c', 'b'])
    expect(poll.cursor).toEqual({ since: 140, seen: ['d'] })
  })

  it('names the author a reply answers, when that comment is in the page', async () => {
    respond(comment('c', 130, 't3_post', [comment('d', 140, 't1_c')], 'alice'))
    const { comments } = await pollThread(ID, { since: 0, seen: [] })
    expect(comments.find((each) => each.comment.id === 'd')!.replyTo).toBe('alice')
    expect(comments.find((each) => each.comment.id === 'c')!.replyTo).toBeNull()
  })

  it('has no name for a reply to a comment outside the page, or a deleted one', async () => {
    respond(
      comment('x', 150, 't1_missing'),
      comment('y', 160, 't3_post', [comment('z', 170, 't1_y')], '[deleted]'),
    )
    const { comments } = await pollThread(ID, { since: 0, seen: [] })
    expect(comments.map((each) => each.replyTo)).toEqual([null, null, null])
  })

  it('tells comments in the cursor’s second apart by id', async () => {
    respond(comment('late', 100), comment('shown', 100), comment('older', 90))
    const poll = await pollThread(ID, { since: 100, seen: ['shown'] })
    expect(poll.comments.map((each) => each.comment.id)).toEqual(['late'])
    expect(poll.cursor).toEqual({ since: 100, seen: ['late', 'shown'] })
  })

  it('keeps the cursor when nothing is new', async () => {
    respond(comment('a', 100))
    const cursor = { since: 100, seen: ['a'] }
    const poll = await pollThread(ID, cursor)
    expect(poll.comments).toEqual([])
    expect(poll.cursor).toBe(cursor)
  })

  it('skips a reply listing that does not parse instead of failing the poll', async () => {
    const broken = comment('a', 100)
    broken.data.replies = { kind: 'Listing', data: { children: 'nope' } } as never
    respond(broken, comment('b', 120))
    const poll = await pollThread(ID, { since: 0, seen: [] })
    expect(poll.comments.map((each) => each.comment.id)).toEqual(['b', 'a'])
  })

  it('ignores "load more" placeholders', async () => {
    respond(
      {
        kind: 'more',
        data: { id: 'm', name: 't1_m', parent_id: 't3_post', count: 5, depth: 0, children: ['q'] },
      },
      comment('a', 100),
    )
    expect((await pollThread(ID, { since: 0, seen: [] })).comments).toHaveLength(1)
  })

  it('returns the post and a hash of its body', async () => {
    respond()
    const poll = await pollThread(ID, { since: 0, seen: [] })
    expect(poll.post.id).toBe(post.id)
    expect(poll.bodyHash).toBe(bodyHashOf(poll.post.body))
  })

  it('rejects a bad id without calling Reddit', async () => {
    await expect(pollThread('../me', { since: 0, seen: [] })).rejects.toBeInstanceOf(
      RedditNotFoundError,
    )
    expect(redditFetch).not.toHaveBeenCalled()
  })

  it('is not found when the response has no post', async () => {
    redditFetch.mockResolvedValue([listing([]), listing([])])
    await expect(pollThread(ID, { since: 0, seen: [] })).rejects.toBeInstanceOf(RedditNotFoundError)
  })
})

describe('the shared read', () => {
  const readers = (...comments: unknown[]) => {
    const link = { kind: 't3', data: { ...post, subreddit_type: 'public', quarantine: false } }
    redditFetch.mockResolvedValue([listing([link]), listing(comments)])
  }
  const fresh = { since: 0, seen: [] as string[] }

  it('reads a public thread once for everyone watching it, for ten seconds', async () => {
    vi.useFakeTimers()
    readers(comment('a', 100))
    await pollThread(ID, fresh)
    await pollThread(ID, fresh)
    expect(redditFetch).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(10_000)
    await pollThread(ID, fresh)
    expect(redditFetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('checks the session every time, even when the answer is shared', async () => {
    readers()
    const requireAuth = vi.mocked(session.requireAuth)
    requireAuth.mockClear()
    await pollThread(ID, fresh)
    await pollThread(ID, fresh)
    expect(requireAuth).toHaveBeenCalledTimes(2)
  })

  it('keeps one reader’s votes and saves out of what another reader is shown', async () => {
    const voted = comment('a', 100)
    Object.assign(voted.data, { likes: true, saved: true })
    readers(voted)
    const first = await pollThread(ID, fresh)
    expect(first.comments[0]!.comment).toMatchObject({ likes: 1, saved: true })

    const second = await pollThread(ID, fresh)
    expect(redditFetch).toHaveBeenCalledTimes(1)
    expect(second.comments[0]!.comment).toMatchObject({ likes: 0, saved: false })
    expect(second.post).toMatchObject({ likes: 0, saved: false })
  })

  it.each([
    ['a private community', { subreddit_type: 'private', quarantine: false }],
    ['a restricted-access one', { subreddit_type: 'gold_only', quarantine: false }],
    ['a quarantined one', { subreddit_type: 'public', quarantine: true }],
    ['one whose type Reddit left out', { subreddit_type: undefined, quarantine: undefined }],
  ])('does not share %s', async (_name, fields) => {
    redditFetch.mockResolvedValue([
      listing([{ kind: 't3', data: { ...post, ...fields } }]),
      listing([comment('a', 100)]),
    ])
    await pollThread(ID, fresh)
    await pollThread(ID, fresh)
    expect(redditFetch).toHaveBeenCalledTimes(2)
  })

  it('keeps each thread separate, and forgets the oldest when it holds too many', async () => {
    readers()
    await pollThread('first', fresh)
    await pollThread('other', fresh)
    expect(redditFetch).toHaveBeenCalledTimes(2)

    for (let index = 0; index < 200; index += 1) await pollThread(`t${index}`, fresh)
    redditFetch.mockClear()
    await pollThread('first', fresh)
    expect(redditFetch).toHaveBeenCalledTimes(1)
    await pollThread('t199', fresh)
    expect(redditFetch).toHaveBeenCalledTimes(1)
  })
})

describe('cursorFromTree', () => {
  const node = (id: string, createdUtc: number, replies: CommentNode[] = []): CommentNode => ({
    kind: 'comment',
    comment: { id, createdUtc } as never,
    replies,
  })

  it('points at the newest comment anywhere in the tree, with its second’s ids', () => {
    const tree = [
      node('sticky', 50),
      node('a', 90, [node('b', 120), node('c', 120)]),
      { kind: 'more', id: 'm', parentId: 't3_x', depth: 0, count: 3, children: [] } as CommentNode,
    ]
    expect(cursorFromTree(tree)).toEqual({ since: 120, seen: ['b', 'c'] })
  })

  it('starts from zero for a thread with no comments', () => {
    expect(cursorFromTree([])).toEqual({ since: 0, seen: [] })
  })
})

describe('bodyHashOf', () => {
  it('is stable, and differs when the body does', () => {
    expect(bodyHashOf('<p>1-0</p>')).toBe(bodyHashOf('<p>1-0</p>'))
    expect(bodyHashOf('<p>1-0</p>')).not.toBe(bodyHashOf('<p>2-0</p>'))
    expect(bodyHashOf(null)).toBe(bodyHashOf(''))
  })
})
