import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const writeFile = vi.fn(async () => {})
const mkdir = vi.fn(async () => undefined)
vi.mock('node:fs/promises', () => ({ writeFile, mkdir }))
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(async () => {}) }))
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(async () => ({ accessToken: 'tok', username: 'RealUser' })),
}))

const redditFetch = vi.fn()
vi.mock('@/lib/reddit/client', () => ({ redditFetch }))

const { GET } = await import('@/app/api/dev/capture/route')
const { RedditNotFoundError } = await import('@/lib/reddit/errors')

const listing = (...ids: string[]) => ({
  kind: 'Listing',
  data: { children: ids.map((id) => ({ kind: 't3', data: { id, author: 'RealUser' } })) },
})

const thread = (withMore: boolean) => [
  listing('x'),
  {
    kind: 'Listing',
    data: {
      children: [
        { kind: 't1', data: { id: 'c1' } },
        withMore
          ? { kind: 'more', data: { children: ['m1', 'm2', 7] } }
          : { kind: 'more', data: { children: [] } },
      ],
    },
  },
]

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development')
  redditFetch.mockImplementation(async (apiPath: string) => {
    if (apiPath === '/r/all/top') return listing('p1', 'p2')
    if (apiPath === '/r/AskReddit/top')
      return { kind: 'Listing', data: { children: [{ kind: 't3' }, 'junk'] } }
    if (apiPath === '/comments/p1') return thread(false)
    if (apiPath === '/comments/p2') return thread(true)
    if (apiPath === '/r/pics/about') throw new RedditNotFoundError()
    if (apiPath === '/r/gifs/top') throw new Error('socket hang up')
    if (apiPath === '/api/v1/me') return { name: 'RealUser', pref_nightmode: true, id: 'u1' }
    return {}
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

const writtenNames = () =>
  writeFile.mock.calls.map((call) => path.basename((call as unknown as [string])[0]))

describe('GET /api/dev/capture', () => {
  it('is unavailable outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const response = await GET()
    expect(response.status).toBe(404)
    expect(redditFetch).not.toHaveBeenCalled()
  })

  it('captures scrubbed fixtures, threads, and a morechildren sample, and reports failures', async () => {
    const response = await GET()
    const body = (await response.json()) as {
      written: number
      failed: Array<{ name: string; error: string }>
    }

    expect(mkdir).toHaveBeenCalledWith(expect.stringMatching(/fixtures[/\\]reddit[/\\]raw$/), {
      recursive: true,
    })
    expect(writtenNames()).toEqual(
      expect.arrayContaining([
        'me.json',
        'all-top-day.json',
        'comments-p1.json',
        'comments-p2.json',
        'morechildren.json',
      ]),
    )
    expect(redditFetch).toHaveBeenCalledWith('/api/morechildren', {
      token: 'tok',
      query: expect.objectContaining({ link_id: 't3_p2', children: 'm1,m2', api_type: 'json' }),
    })

    // The username is scrubbed, and /api/v1/me is reduced to public fields.
    const written = Object.fromEntries(
      writeFile.mock.calls.map((call) => {
        const [file, text] = call as unknown as [string, string]
        return [path.basename(file), JSON.parse(text) as unknown]
      }),
    )
    expect(written['me.json']).toEqual({ name: 'fixture_user', id: 'u1' })
    expect(JSON.stringify(written['all-top-day.json'])).not.toContain('RealUser')

    expect(body.failed).toEqual(
      expect.arrayContaining([
        {
          name: 'sub-about-pics',
          ok: false,
          error: expect.stringContaining('RedditNotFoundError'),
        },
        { name: 'media-gifs', ok: false, error: 'Error: socket hang up' },
      ]),
    )
    expect(body.written).toBe(writeFile.mock.calls.length)
  })

  it('skips morechildren when no thread has one', async () => {
    redditFetch.mockImplementation(async (apiPath: string) =>
      apiPath === '/r/all/top' ? listing('p1') : apiPath === '/comments/p1' ? thread(false) : {},
    )
    await GET()
    expect(writtenNames()).not.toContain('morechildren.json')
  })
})
