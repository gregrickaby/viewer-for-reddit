import { beforeEach, describe, expect, it, vi } from 'vitest'

const submitComment = vi.fn(async () => ({ id: 'new1', postId: 'abc' }))
const editComment = vi.fn(async () => {})
const deleteComment = vi.fn(async () => {})
const refresh = vi.fn()
const waitForComment = vi.fn(async () => {})
vi.mock('@/lib/reddit/thread', () => ({ waitForComment }))
vi.mock('@/lib/reddit/writes', () => ({ submitComment, editComment, deleteComment }))
vi.mock('next/cache', () => ({ refresh }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ SessionUnavailableError: class extends Error {} }))

const actions = await import('@/app/actions/comments')
const { RedditApiError } = await import('@/lib/reddit/errors')

const form = (values: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

beforeEach(() => {
  for (const mock of [submitComment, editComment, deleteComment, refresh, waitForComment])
    mock.mockClear()
})

describe('postComment', () => {
  it('posts trimmed text and re-renders the thread', async () => {
    expect(await actions.postComment(form({ parent: 't3_abc', text: '  Hi there  ' }))).toEqual({
      ok: true,
      data: { id: 'new1' },
    })
    expect(submitComment).toHaveBeenCalledWith('t3_abc', 'Hi there')
    expect(waitForComment).toHaveBeenCalledWith('abc', 'new1')
    expect(refresh).toHaveBeenCalledOnce()
  })

  it.each([
    [{ parent: 't5_abc', text: 'x' }, 'That request wasn’t valid.'],
    [{ parent: 't1_abc', text: '   ' }, /Write something first/],
    [{ parent: 't1_abc', text: 'x'.repeat(10_001) }, /Write something first/],
  ])('rejects %o', async (values, message) => {
    const result = await actions.postComment(form(values))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.message).toMatch(message)
    expect(submitComment).not.toHaveBeenCalled()
  })

  it('reports Reddit’s reason without re-rendering', async () => {
    submitComment.mockRejectedValueOnce(new RedditApiError('locked', 200, 'THREAD_LOCKED'))
    expect(await actions.postComment(form({ parent: 't1_abc', text: 'x' }))).toEqual({
      ok: false,
      error: { code: 'REDDIT', message: 'This thread is locked.' },
    })
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('editComment and deleteComment', () => {
  it('edit your own comment', async () => {
    expect(await actions.editComment(form({ thing: 't1_abc', text: 'Fixed' }))).toEqual({
      ok: true,
      data: undefined,
    })
    expect(editComment).toHaveBeenCalledWith('t1_abc', 'Fixed')
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('delete your own comment', async () => {
    expect((await actions.deleteComment(form({ thing: 't1_abc', post: 'p1' }))).ok).toBe(true)
    expect(deleteComment).toHaveBeenCalledWith('t1_abc')
    expect(waitForComment).toHaveBeenCalledWith('p1', 'abc', 'deleted')
  })

  it('reject forms with missing fields', async () => {
    const empty = new FormData()
    for (const action of [actions.postComment, actions.editComment, actions.deleteComment]) {
      expect((await action(empty)).ok).toBe(false)
    }
    expect((await actions.postComment(form({ parent: 't3_abc' }))).ok).toBe(false)
  })

  it('reject posts, bad ids, and empty edits', async () => {
    expect((await actions.editComment(form({ thing: 't3_abc', text: 'x' }))).ok).toBe(false)
    expect((await actions.editComment(form({ thing: 't1_abc', text: '' }))).ok).toBe(false)
    expect((await actions.deleteComment(form({ thing: 'abc' }))).ok).toBe(false)
    expect(editComment).not.toHaveBeenCalled()
    expect(deleteComment).not.toHaveBeenCalled()
  })
})
