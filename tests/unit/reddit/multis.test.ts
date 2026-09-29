import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sample } from '@/tests/helpers/fixtures'

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'fixture_user' })),
}))

const { createMulti, deleteMulti, getMulti, multiSlug, setMultiMembership, updateMulti } =
  await import('@/lib/reddit/multis')
const { RedditApiError, RedditNotFoundError } = await import('@/lib/reddit/errors')

const multi = sample('LabeledMulti')
const thing = { kind: 'LabeledMulti', data: multi }
const base = `/api/multi/user/fixture_user/m`

beforeEach(() => redditFetch.mockReset())

describe('multiSlug', () => {
  it.each([
    ['News', 'news'],
    ['  Dev & Design!  ', 'dev_design'],
    ['a__b', 'a_b'],
    ['x'.repeat(60), 'x'.repeat(50)],
    [`${'a'.repeat(49)} b`, 'a'.repeat(49)],
    ['!', null],
    ['a', null],
  ])('%s → %s', (input, expected) => {
    expect(multiSlug(input)).toBe(expected)
  })
})

describe('reads and writes', () => {
  it('reads one of the viewer’s multis', async () => {
    redditFetch.mockResolvedValue(thing)
    const view = await getMulti('five')
    expect(redditFetch).toHaveBeenCalledWith(`${base}/five`, {
      token: 'tok',
      query: { expand_srs: true },
    })
    expect(view.subreddits.length).toBeGreaterThan(0)
    expect(view.href).toBe(`/m/${String(multi.name)}`)
  })

  it('creates a private, empty multi from a display name', async () => {
    redditFetch.mockResolvedValue(thing)
    await createMulti({ displayName: 'My News', description: 'Daily' })
    const [path, init] = redditFetch.mock.calls[0]!
    expect(path).toBe(`${base}/my_news`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.form.model)).toEqual({
      display_name: 'My News',
      description_md: 'Daily',
      visibility: 'private',
      subreddits: [],
    })
  })

  it('refuses names that slug to nothing', async () => {
    await expect(createMulti({ displayName: '!!', description: '' })).rejects.toMatchObject({
      constructor: RedditApiError,
      code: 'BAD_MULTI_NAME',
    })
    expect(redditFetch).not.toHaveBeenCalled()
  })

  it('updates details while keeping the current subreddits', async () => {
    redditFetch.mockResolvedValue(thing)
    await updateMulti('five', { displayName: 'Five', description: 'New', visibility: 'public' })
    const [path, init] = redditFetch.mock.calls[1]!
    expect(path).toBe(`${base}/five`)
    expect(init.method).toBe('PUT')
    const sent = JSON.parse(init.form.model)
    expect(sent).toMatchObject({
      display_name: 'Five',
      description_md: 'New',
      visibility: 'public',
    })
    expect(sent.subreddits).toHaveLength((multi.subreddits as unknown[]).length)
  })

  it('deletes', async () => {
    redditFetch.mockResolvedValue({})
    await deleteMulti('five')
    expect(redditFetch).toHaveBeenCalledWith(`${base}/five`, { token: 'tok', method: 'DELETE' })
  })

  it('adds and removes one subreddit', async () => {
    redditFetch.mockResolvedValue({ name: 'pics' })
    await setMultiMembership('five', 'pics', true)
    redditFetch.mockResolvedValue({})
    await setMultiMembership('five', 'pics', false)
    expect(redditFetch.mock.calls).toEqual([
      [`${base}/five/r/pics`, { token: 'tok', method: 'PUT', form: { model: '{"name":"pics"}' } }],
      [`${base}/five/r/pics`, { token: 'tok', method: 'DELETE', form: undefined }],
    ])
  })

  it('refuses bad names before calling Reddit', async () => {
    await expect(getMulti('../x')).rejects.toBeInstanceOf(RedditNotFoundError)
    await expect(setMultiMembership('five', 'a/b', true)).rejects.toBeInstanceOf(
      RedditNotFoundError,
    )
    expect(redditFetch).not.toHaveBeenCalled()
  })
})
