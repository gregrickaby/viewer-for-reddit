import { describe, expect, it, vi } from 'vitest'

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`)
})
const unstable_rethrow = vi.fn((error: unknown) => {
  if (error instanceof Error && error.message === 'NEXT_NOT_FOUND') throw error
})
vi.mock('next/navigation', () => ({ redirect, unstable_rethrow }))

const { invalid, runAction } = await import('@/lib/actions/run-action')
const { SessionUnavailableError } = await import('@/lib/auth/session')
const errors = await import('@/lib/reddit/errors')

const fail = (error: unknown) => runAction(async () => Promise.reject(error))

describe('runAction', () => {
  it('wraps success', async () => {
    expect(await runAction(async () => 42)).toEqual({ ok: true, data: 42 })
  })

  it.each([
    [new SessionUnavailableError(), 'UNAVAILABLE', /could not be refreshed/],
    [new errors.RedditRateLimitError(8), 'RATE_LIMITED', /Try again in 8s/],
    [new errors.RedditForbiddenError('banned'), 'FORBIDDEN', /doesn’t allow/],
    [new errors.RedditNotFoundError(), 'NOT_FOUND', /no longer exists/],
    [new errors.RedditApiError('locked', 200, 'THREAD_LOCKED'), 'REDDIT', /locked/],
    [new errors.RedditApiError('odd', 500, 'SOMETHING_NEW'), 'REDDIT', /couldn’t do that/],
    [new errors.RedditApiError('odd', 500), 'REDDIT', /couldn’t do that/],
  ])('maps %s', async (error, code, message) => {
    const result = await fail(error)
    expect(result).toMatchObject({ ok: false, error: { code } })
    expect(!result.ok && result.error.message).toMatch(message)
  })

  it('logs unexpected failures without leaking them', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await fail(new TypeError('secret detail'))).toEqual({
      ok: false,
      error: { code: 'UNKNOWN', message: 'Something went wrong. Try again.' },
    })
    expect(log).toHaveBeenCalled()
  })

  it('signs out on an expired session', async () => {
    await expect(fail(new errors.RedditAuthError())).rejects.toThrow(
      'NEXT_REDIRECT /api/auth/signout?reason=expired',
    )
  })

  it('lets Next control flow through', async () => {
    await expect(fail(new Error('NEXT_NOT_FOUND'))).rejects.toThrow('NEXT_NOT_FOUND')
  })
})

describe('invalid', () => {
  it('has a default message', () => {
    expect(invalid()).toEqual({
      ok: false,
      error: { code: 'INVALID', message: 'That request wasn’t valid.' },
    })
    expect(invalid('Nope')).toMatchObject({ error: { message: 'Nope' } })
  })
})
