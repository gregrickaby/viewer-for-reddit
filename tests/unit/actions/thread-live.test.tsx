import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NewComment, ThreadPoll } from '@/lib/reddit/thread-live'
import { html, postView } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'
import type { CommentView } from '@/lib/view-models'

const commentView = (id: string): CommentView =>
  ({
    id,
    fullname: `t1_${id}`,
    author: 'alice',
    body: html('<p>What a goal</p>'),
    createdUtc: 1_700_000_000,
    editedUtc: null,
    score: 3,
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
    permalink: `/r/hockey/comments/abc/x/${id}`,
    depth: 0,
    context: null,
    mine: false,
    bodyMarkdown: null,
  }) satisfies CommentView

const state = {
  comments: [] as NewComment[],
  body: html('<p>Final</p>') as ReturnType<typeof html> | null,
}
const pollThread = vi.fn<(id: string, cursor: unknown) => Promise<ThreadPoll>>(async () => ({
  comments: state.comments,
  cursor: { since: 200, seen: ['b'] },
  post: postView({ body: state.body, numComments: 99 }),
  bodyHash: 'hash-now',
}))
vi.mock('@/lib/reddit/thread-live', () => ({ pollThread }))
vi.mock('@/lib/settings', () => ({ getSettings: vi.fn(async () => ({ blurNsfw: false })) }))
vi.mock('@/app/actions/things', () => ({ vote: vi.fn(), setSaved: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ SessionUnavailableError: class extends Error {} }))

const { pollThreadLive } = await import('@/app/actions/thread-live')
const { RedditNotFoundError } = await import('@/lib/reddit/errors')

const request = { id: 'abc123', cursor: { since: 100, seen: ['a'] }, bodyHash: 'hash-before' }

beforeEach(() => {
  pollThread.mockClear()
  state.comments = [{ comment: commentView('b'), replyTo: 'bob' }]
  state.body = html('<p>Final</p>')
})

describe('pollThreadLive', () => {
  it('renders new comments on the server, with who they answer', async () => {
    const result = await pollThreadLive(request)
    expect(pollThread).toHaveBeenCalledWith('abc123', request.cursor)
    if (!result.ok) throw new Error('expected success')
    expect(result.data).toMatchObject({
      count: 1,
      cursor: { since: 200, seen: ['b'] },
      numComments: 99,
    })
    const markup = await renderServer(<ol>{result.data.items}</ol>)
    expect(markup).toContain('What a goal')
    expect(markup).toContain('Replying to u/')
  })

  it('sends the body only when it changed since the page rendered it', async () => {
    const changed = await pollThreadLive(request)
    if (!changed.ok || !changed.data.body) throw new Error('expected a body')
    expect(await renderServer(<>{changed.data.body.node}</>)).toContain('Final')
    expect(changed.data.bodyHash).toBe('hash-now')

    const same = await pollThreadLive({ ...request, bodyHash: 'hash-now' })
    if (!same.ok) throw new Error('expected success')
    expect(same.data.body).toBeNull()
  })

  it('sends an emptied body as a change too', async () => {
    state.body = null
    const result = await pollThreadLive(request)
    if (!result.ok) throw new Error('expected success')
    expect(result.data.body).toEqual({ node: null })
  })

  it('returns a typed error when the thread is gone', async () => {
    pollThread.mockRejectedValueOnce(new RedditNotFoundError())
    expect(await pollThreadLive(request)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  })

  it.each([
    { ...request, id: '../me' },
    { ...request, cursor: { since: -1, seen: [] } },
    { ...request, cursor: { since: 1, seen: ['NOT AN ID'] } },
    { ...request, cursor: { since: 1, seen: Array.from({ length: 101 }, () => 'a') } },
    { ...request, bodyHash: 'x'.repeat(40) },
    null,
  ])('rejects %o without calling Reddit', async (input) => {
    expect(await pollThreadLive(input)).toMatchObject({ ok: false, error: { code: 'INVALID' } })
    expect(pollThread).not.toHaveBeenCalled()
  })
})
