import { beforeEach, describe, expect, it, vi } from 'vitest'

const castVote = vi.fn(async () => {})
const saveThing = vi.fn(async () => {})
vi.mock('@/lib/reddit/writes', () => ({ castVote, saveThing }))
vi.mock('@/lib/auth/session', () => ({ SessionUnavailableError: class extends Error {} }))
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`)
})
vi.mock('next/navigation', () => ({ redirect, unstable_rethrow: vi.fn() }))

const { setSaved, vote } = await import('@/app/actions/things')

const form = (values: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

beforeEach(() => {
  castVote.mockClear()
  saveThing.mockClear()
})

describe('vote', () => {
  it.each([
    [{ target: '1', current: '0' }, 1],
    [{ target: '-1', current: '1' }, -1],
    // Pressing the active arrow clears the vote.
    [{ target: '1', current: '1' }, 0],
    [{ target: '-1', current: '-1' }, 0],
  ])('%o → dir %d', async (values, likes) => {
    expect(await vote(form({ id: 't3_abc', ...values }))).toEqual({ ok: true, data: { likes } })
    expect(castVote).toHaveBeenCalledWith('t3_abc', likes)
  })

  it.each([
    { id: 't5_abc', target: '1', current: '0' },
    { id: 't3_abc', target: '0', current: '0' },
    { id: 't3_abc', target: '1', current: '2' },
    { id: 't3_abc', target: '1' },
    {},
  ])('rejects invalid input %o without calling Reddit', async (values) => {
    expect(await vote(form(values as Record<string, string>))).toMatchObject({
      ok: false,
      error: { code: 'INVALID' },
    })
    expect(castVote).not.toHaveBeenCalled()
  })

  it('reports Reddit failures as results', async () => {
    const { RedditApiError } = await import('@/lib/reddit/errors')
    castVote.mockRejectedValueOnce(new RedditApiError('archived', 400, 'TOO_OLD'))
    expect(await vote(form({ id: 't1_abc', target: '1', current: '0' }))).toEqual({
      ok: false,
      error: { code: 'REDDIT', message: 'This is archived and can no longer be changed.' },
    })
  })
})

describe('setSaved', () => {
  it('saves and unsaves', async () => {
    expect(await setSaved(form({ id: 't3_abc', saved: 'true' }))).toEqual({
      ok: true,
      data: { saved: true },
    })
    expect(await setSaved(form({ id: 't1_abc', saved: 'false' }))).toEqual({
      ok: true,
      data: { saved: false },
    })
    expect(saveThing.mock.calls).toEqual([
      ['t3_abc', true],
      ['t1_abc', false],
    ])
  })

  it('rejects invalid input', async () => {
    expect((await setSaved(form({ id: 't3_abc', saved: 'yes' }))).ok).toBe(false)
    expect((await setSaved(form({ saved: 'true' }))).ok).toBe(false)
    expect(saveThing).not.toHaveBeenCalled()
  })
})
