import { beforeEach, describe, expect, it, vi } from 'vitest'

const setSubscription = vi.fn(async () => {})
const refresh = vi.fn()
vi.mock('@/lib/reddit/writes', () => ({ setSubscription }))
vi.mock('next/cache', () => ({ refresh }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ SessionUnavailableError: class extends Error {} }))

const { setSubscription: action } = await import('@/app/actions/subscriptions')

const form = (values: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

beforeEach(() => {
  setSubscription.mockClear()
  refresh.mockClear()
})

describe('setSubscription', () => {
  it('joins a community and re-renders', async () => {
    expect(
      await action(form({ name: 'typescript', kind: 'community', subscribe: 'true' })),
    ).toEqual({
      ok: true,
      data: { subscribed: true },
    })
    expect(setSubscription).toHaveBeenCalledWith('typescript', true)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('follows people through their profile subreddit', async () => {
    await action(form({ name: 'spez', kind: 'user', subscribe: 'false' }))
    expect(setSubscription).toHaveBeenCalledWith('u_spez', false)
  })

  it.each([
    { name: 'typescript', kind: 'community', subscribe: 'yes' },
    { name: 'a', kind: 'community', subscribe: 'true' },
    { name: 'x', kind: 'user', subscribe: 'true' },
    { name: 'spez', kind: 'robot', subscribe: 'true' },
    {},
  ])('rejects %o', async (values) => {
    expect((await action(form(values as Record<string, string>))).ok).toBe(false)
    expect(setSubscription).not.toHaveBeenCalled()
  })
})
