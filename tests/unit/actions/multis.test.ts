import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as MultisModule from '@/lib/reddit/multis'
import { multiView, subredditView } from '@/tests/helpers/views'

const createMulti = vi.fn(async () => multiView({ name: 'my_news' }))
const updateMulti = vi.fn(async () => {})
const deleteMulti = vi.fn(async () => {})
const setMultiMembership = vi.fn(async () => {})
const getSubreddit = vi.fn(async (name: string) =>
  subredditView({ name: name === 'PICS' ? 'pics' : name }),
)
const refresh = vi.fn()
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`)
})

vi.mock('@/lib/reddit/multis', async (importOriginal) => ({
  ...(await importOriginal<typeof MultisModule>()),
  createMulti,
  updateMulti,
  deleteMulti,
  setMultiMembership,
}))
vi.mock('@/lib/reddit/reads', () => ({ getSubreddit }))
vi.mock('next/cache', () => ({ refresh }))
vi.mock('next/navigation', () => ({
  redirect,
  unstable_rethrow: vi.fn((error: unknown) => {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) throw error
  }),
}))
vi.mock('@/lib/auth/session', () => ({
  SessionUnavailableError: class extends Error {},
  requireAuth: vi.fn(),
}))

const actions = await import('@/app/actions/multis')
const { RedditApiError, RedditNotFoundError, RedditRateLimitError } =
  await import('@/lib/reddit/errors')

const form = (values: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

beforeEach(() => {
  for (const mock of [
    createMulti,
    updateMulti,
    deleteMulti,
    setMultiMembership,
    getSubreddit,
    refresh,
    redirect,
  ]) {
    mock.mockClear()
  }
})

describe('createMultiForm', () => {
  it('creates and opens the editor', async () => {
    await expect(
      actions.createMultiForm(null, form({ displayName: ' My News ', description: 'Daily' })),
    ).rejects.toThrow('NEXT_REDIRECT /multis/my_news')
    expect(createMulti).toHaveBeenCalledWith({ displayName: 'My News', description: 'Daily' })
  })

  it.each([
    [{ displayName: '' }, /Give it a name/],
    [{ displayName: 'x'.repeat(51) }, /Give it a name/],
    [{ displayName: 'ok', description: 'x'.repeat(501) }, /Give it a name/],
    [{ displayName: '!!' }, /at least two letters/],
  ])('rejects %o', async (values, message) => {
    const result = await actions.createMultiForm(null, form(values))
    expect(result?.ok).toBe(false)
    expect(result && !result.ok && result.error.message).toMatch(message)
    expect(createMulti).not.toHaveBeenCalled()
  })

  it('shows Reddit’s reason when it refuses', async () => {
    createMulti.mockRejectedValueOnce(new RedditApiError('conflict', 409, 'MULTI_EXISTS'))
    expect(await actions.createMultiForm(null, form({ displayName: 'News' }))).toEqual({
      ok: false,
      error: { code: 'REDDIT', message: 'You already have a multireddit with that name.' },
    })
  })
})

describe('updateMultiForm', () => {
  it('saves details and re-renders', async () => {
    const values = { name: 'news', displayName: 'News', description: '', visibility: 'public' }
    expect(await actions.updateMultiForm(null, form(values))).toEqual({
      ok: true,
      data: { saved: true },
    })
    expect(updateMulti).toHaveBeenCalledWith('news', {
      displayName: 'News',
      description: '',
      visibility: 'public',
    })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('rejects bad names, visibilities, and details', async () => {
    expect(
      (
        await actions.updateMultiForm(
          null,
          form({ name: '../x', displayName: 'N', visibility: 'public' }),
        )
      )?.ok,
    ).toBe(false)
    expect(
      (
        await actions.updateMultiForm(
          null,
          form({ name: 'news', displayName: 'N', visibility: 'secret' }),
        )
      )?.ok,
    ).toBe(false)
    const empty = await actions.updateMultiForm(
      null,
      form({ name: 'news', displayName: '', visibility: 'private' }),
    )
    expect(empty && !empty.ok && empty.error.message).toMatch(/Give it a name/)
    expect(updateMulti).not.toHaveBeenCalled()
  })
})

describe('deleteMulti', () => {
  it('deletes and returns to the list', async () => {
    await expect(actions.deleteMulti(form({ name: 'news' }))).rejects.toThrow(
      'NEXT_REDIRECT /multis',
    )
    expect(deleteMulti).toHaveBeenCalledWith('news')
  })

  it('stays put on failure or bad input', async () => {
    deleteMulti.mockRejectedValueOnce(new RedditRateLimitError(3))
    expect((await actions.deleteMulti(form({ name: 'news' }))).ok).toBe(false)
    expect((await actions.deleteMulti(form({ name: '' }))).ok).toBe(false)
    expect(redirect).not.toHaveBeenCalled()
  })
})

describe('setMembership', () => {
  it('adds with the canonical name after checking the subreddit exists', async () => {
    expect(
      await actions.setMembership(form({ multi: 'news', subreddit: '/r/PICS/', member: 'true' })),
    ).toEqual({
      ok: true,
      data: { subreddit: 'pics', member: true },
    })
    expect(getSubreddit).toHaveBeenCalledWith('PICS')
    expect(setMultiMembership).toHaveBeenCalledWith('news', 'pics', true)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('removes without a lookup', async () => {
    await actions.setMembership(form({ multi: 'news', subreddit: 'pics', member: 'false' }))
    expect(getSubreddit).not.toHaveBeenCalled()
    expect(setMultiMembership).toHaveBeenCalledWith('news', 'pics', false)
  })

  it('names a subreddit that doesn’t exist, and writes nothing', async () => {
    getSubreddit.mockRejectedValueOnce(new RedditNotFoundError())
    expect(
      await actions.setMembership(form({ multi: 'news', subreddit: 'nopenope', member: 'true' })),
    ).toEqual({
      ok: false,
      error: { code: 'REDDIT', message: 'r/nopenope doesn’t exist.' },
    })
    expect(setMultiMembership).not.toHaveBeenCalled()
  })

  it('passes other lookup failures through', async () => {
    getSubreddit.mockRejectedValueOnce(new RedditRateLimitError(9))
    const result = await actions.setMembership(
      form({ multi: 'news', subreddit: 'pics', member: 'true' }),
    )
    expect(!result.ok && result.error.code).toBe('RATE_LIMITED')
  })

  it.each([
    { multi: 'news', subreddit: 'pics', member: 'maybe' },
    { multi: '', subreddit: 'pics', member: 'true' },
    { multi: 'news', subreddit: 'bad name!', member: 'true' },
    {},
  ])('rejects %o', async (values) => {
    expect((await actions.setMembership(form(values as Record<string, string>))).ok).toBe(false)
    expect(setMultiMembership).not.toHaveBeenCalled()
  })

  it('backs the "Add a community" form', async () => {
    expect(
      await actions.addToMultiForm(null, form({ multi: 'news', subreddit: 'aww' })),
    ).toMatchObject({ ok: true })
    expect(setMultiMembership).toHaveBeenCalledWith('news', 'aww', true)
  })
})
