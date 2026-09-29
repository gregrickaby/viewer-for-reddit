import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sample, samples } from '@/tests/helpers/fixtures'

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'fixture_user' })),
}))

const { getThread, waitForComment } = await import('@/lib/reddit/thread')
const { deleteComment, editComment, submitComment } = await import('@/lib/reddit/writes')
const { RedditApiError, RedditNotFoundError } = await import('@/lib/reddit/errors')
const { parseThreadQuery } = await import('@/lib/url-state')

const listing = (children: unknown[]) => ({
  kind: 'Listing',
  data: { after: null, before: null, children },
})

beforeEach(() => {
  redditFetch.mockReset()
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('getThread', () => {
  const post = sample('Link', (v) => v.is_self === true && !v.removed_by_category)
  const [first, second] = samples('Comment')

  it('fetches the post and comments in one call', async () => {
    first!.replies = ''
    first!.author = 'fixture_user'
    redditFetch.mockResolvedValue([
      listing([{ kind: 't3', data: post }]),
      listing([{ kind: 't1', data: first }]),
    ])
    const thread = await getThread({
      id: 'abc123',
      query: parseThreadQuery({}),
      focusCommentId: null,
    })

    expect(redditFetch).toHaveBeenCalledWith('/comments/abc123', {
      token: 'tok',
      query: { sort: 'confidence', limit: 200, depth: 8, comment: null, context: undefined },
    })
    expect(thread.post.id).toBe(post.id)
    expect(thread.focusCommentId).toBeNull()
    const [node] = thread.comments
    expect(node?.kind === 'comment' && node.comment.mine).toBe(true)
  })

  it('focuses a single comment thread with context', async () => {
    redditFetch.mockResolvedValue([listing([{ kind: 't3', data: post }]), listing([])])
    const thread = await getThread({
      id: 'abc',
      query: parseThreadQuery({ sort: 'new' }),
      focusCommentId: 'def',
    })
    expect(redditFetch.mock.calls[0]![1].query).toMatchObject({
      sort: 'new',
      comment: 'def',
      context: 3,
    })
    expect(thread.focusCommentId).toBe('def')
  })

  it('ignores a malformed focus id', async () => {
    redditFetch.mockResolvedValue([listing([{ kind: 't3', data: post }]), listing([])])
    const thread = await getThread({
      id: 'abc',
      query: parseThreadQuery({}),
      focusCommentId: '../x',
    })
    expect(thread.focusCommentId).toBeNull()
  })

  it('expands requested more nodes through /api/morechildren', async () => {
    first!.replies = listing([
      {
        kind: 'more',
        data: {
          id: 'm1',
          name: 't1_m1',
          parent_id: `t1_${String(first!.id)}`,
          count: 2,
          depth: 1,
          children: ['r1', 'r2'],
        },
      },
    ])
    const reply = {
      ...second!,
      id: 'r1',
      name: 't1_r1',
      parent_id: `t1_${String(first!.id)}`,
      replies: '',
    }
    redditFetch
      .mockResolvedValueOnce([
        listing([{ kind: 't3', data: post }]),
        listing([{ kind: 't1', data: first }]),
      ])
      .mockResolvedValueOnce({
        json: {
          errors: [],
          data: {
            things: [
              { kind: 't1', data: reply },
              {
                kind: 'more',
                data: {
                  id: 'm2',
                  name: 't1_m2',
                  parent_id: 't1_r1',
                  count: 0,
                  depth: 2,
                  children: [],
                },
              },
            ],
          },
        },
      })
    const thread = await getThread({
      id: 'abc',
      query: parseThreadQuery({ more: 'm1' }),
      focusCommentId: null,
    })

    expect(redditFetch.mock.calls[1]).toEqual([
      '/api/morechildren',
      {
        token: 'tok',
        query: {
          api_type: 'json',
          link_id: post.name,
          children: 'r1,r2',
          sort: 'confidence',
          limit_children: false,
        },
      },
    ])
    const [root] = thread.comments
    const replies = root?.kind === 'comment' ? root.replies : []
    expect(replies.map((node) => node.kind)).toEqual(['comment'])
    const nested = replies[0]?.kind === 'comment' ? replies[0].replies : []
    expect(nested).toEqual([expect.objectContaining({ kind: 'more', id: 'm2', count: 0 })])
  })

  it('treats an empty morechildren response as no replies', async () => {
    first!.replies = listing([
      {
        kind: 'more',
        data: {
          id: 'm1',
          name: 't1_m1',
          parent_id: `t1_${String(first!.id)}`,
          count: 1,
          depth: 1,
          children: ['r1'],
        },
      },
    ])
    redditFetch
      .mockResolvedValueOnce([
        listing([{ kind: 't3', data: post }]),
        listing([{ kind: 't1', data: first }]),
      ])
      .mockResolvedValueOnce({ json: { errors: [] } })
    const thread = await getThread({
      id: 'abc',
      query: parseThreadQuery({ more: 'm1' }),
      focusCommentId: null,
    })
    const [root] = thread.comments
    expect(root?.kind === 'comment' && root.replies).toEqual([])
  })

  it('404s bad ids and empty post listings', async () => {
    await expect(
      getThread({ id: 'A-B', query: parseThreadQuery({}), focusCommentId: null }),
    ).rejects.toBeInstanceOf(RedditNotFoundError)
    redditFetch.mockResolvedValue([listing([]), listing([])])
    await expect(
      getThread({ id: 'abc', query: parseThreadQuery({}), focusCommentId: null }),
    ).rejects.toBeInstanceOf(RedditNotFoundError)
  })
})

describe('comment writes', () => {
  const created = sample('Comment')

  it('posts a comment and returns its id', async () => {
    redditFetch.mockResolvedValue({
      json: { errors: [], data: { things: [{ kind: 't1', data: { ...created, replies: '' } }] } },
    })
    expect(await submitComment('t3_abc', 'Hello')).toEqual({
      id: created.id,
      postId: String(created.link_id).replace(/^t3_/, ''),
    })
    expect(redditFetch).toHaveBeenCalledWith('/api/comment', {
      token: 'tok',
      method: 'POST',
      form: { api_type: 'json', thing_id: 't3_abc', text: 'Hello' },
    })
  })

  it('returns null when Reddit omits the new comment', async () => {
    redditFetch.mockResolvedValue({ json: { errors: [] } })
    expect(await submitComment('t1_abc', 'Hi')).toEqual({ id: null, postId: null })
  })

  it('turns Reddit form errors into typed errors', async () => {
    redditFetch.mockResolvedValue({
      json: { errors: [['THREAD_LOCKED', 'that thread is locked', 'parent']] },
    })
    await expect(submitComment('t3_abc', 'x')).rejects.toMatchObject({
      constructor: RedditApiError,
      code: 'THREAD_LOCKED',
      field: 'parent',
    })
    redditFetch.mockResolvedValue({ json: { errors: [['RATELIMIT', 'slow down']] } })
    await expect(editComment('t1_abc', 'x')).rejects.toMatchObject({
      code: 'RATELIMIT',
      field: null,
    })
  })

  it('edits and deletes', async () => {
    redditFetch.mockResolvedValueOnce({ json: { errors: [] } }).mockResolvedValueOnce({})
    await editComment('t1_abc', 'Better')
    await deleteComment('t1_abc')
    expect(redditFetch.mock.calls.map((call) => call[0])).toEqual(['/api/editusertext', '/api/del'])
    expect(redditFetch.mock.calls[1]![1].form).toEqual({ id: 't1_abc' })
  })
})

describe('waitForComment', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns as soon as the listing includes the comment', async () => {
    redditFetch.mockResolvedValueOnce([{}, { data: { id: 'old', body: 'x' } }])
    redditFetch.mockResolvedValueOnce([{}, { data: { id: 'new1', body: 'x' } }])
    const done = waitForComment('abc', 'new1')
    await vi.runAllTimersAsync()
    await done
    expect(redditFetch).toHaveBeenCalledTimes(2)
    expect(redditFetch).toHaveBeenCalledWith('/comments/abc', {
      token: 'tok',
      query: { sort: 'new', limit: 500 },
    })
  })

  it('gives up after a few tries', async () => {
    redditFetch.mockResolvedValue([{}, { data: { id: 'old', body: 'x' } }])
    const done = waitForComment('abc', 'new1')
    await vi.runAllTimersAsync()
    await done
    expect(redditFetch).toHaveBeenCalledTimes(5)
  })

  it('waits for a deleted comment to read [deleted], or to disappear', async () => {
    redditFetch.mockResolvedValueOnce([{}, { data: { id: 'c1', body: 'x', author: 'me' } }])
    redditFetch.mockResolvedValueOnce([
      {},
      { data: { id: 'c1', body: '[deleted]', author: '[deleted]' } },
    ])
    const first = waitForComment('abc', 'c1', 'deleted')
    await vi.runAllTimersAsync()
    await first
    expect(redditFetch).toHaveBeenCalledTimes(2)

    redditFetch.mockClear()
    redditFetch.mockResolvedValue([{}, { data: { id: 'other', body: 'x' } }])
    await waitForComment('abc', 'c1', 'deleted')
    expect(redditFetch).toHaveBeenCalledTimes(1)
  })

  it('stops quietly when Reddit errors or the id is malformed', async () => {
    redditFetch.mockRejectedValue(new Error('down'))
    await waitForComment('abc', 'new1')
    expect(redditFetch).toHaveBeenCalledTimes(1)
    redditFetch.mockClear()
    await waitForComment('not valid!', 'new1')
    expect(redditFetch).not.toHaveBeenCalled()
  })
})
