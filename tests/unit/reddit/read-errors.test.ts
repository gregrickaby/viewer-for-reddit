import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  unstable_rethrow: vi.fn(),
}))

const { handleReadError } = await import('@/lib/reddit/read-errors')
const errors = await import('@/lib/reddit/errors')
const { isMultiName, isSubredditName, isUsername, isVotableFullname } =
  await import('@/lib/reddit/names')

describe('handleReadError', () => {
  it('signs out, 404s, returns forbidden reasons, and rethrows the rest', () => {
    expect(() => handleReadError(new errors.RedditAuthError())).toThrow(
      'NEXT_REDIRECT /api/auth/signout?reason=expired',
    )
    expect(() => handleReadError(new errors.RedditNotFoundError())).toThrow('NEXT_NOT_FOUND')
    expect(handleReadError(new errors.RedditForbiddenError('private'))).toBe('private')
    const other = new errors.RedditRateLimitError(5)
    expect(() => handleReadError(other)).toThrow(other)
  })
})

describe('names', () => {
  it('validates what goes into API paths', () => {
    expect([isSubredditName('pics'), isSubredditName('a'), isSubredditName('a/b')]).toEqual([
      true,
      false,
      false,
    ])
    expect([isUsername('spez'), isUsername('x'), isUsername('bad name')]).toEqual([
      true,
      false,
      false,
    ])
    expect([isMultiName('news_2'), isMultiName('n'), isMultiName('../x')]).toEqual([
      true,
      false,
      false,
    ])
    expect([
      isVotableFullname('t3_abc'),
      isVotableFullname('t1_abc'),
      isVotableFullname('t5_abc'),
    ]).toEqual([true, true, false])
  })
})
