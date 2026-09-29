import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Link, type RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { PER_BUCKET, expectedOf, fileName, selectCorpus } from '@/scripts/reddit/corpus'
import { sample, samples } from '@/tests/helpers/fixtures'

const links = samples('Link').map((value) => Link.parse(value))
const image: PostMedia = {
  type: 'image',
  image: { src: 'x', srcSet: '', width: 1, height: 1, blurred: null },
}
const everyHost = () => true

describe('selectCorpus', () => {
  it('keeps two posts per host and media type, each used once', () => {
    const buckets = selectCorpus(links, () => image, everyHost)
    for (const entries of buckets.values()) expect(entries.length).toBeLessThanOrEqual(PER_BUCKET)
    const names = [...buckets.values()].flat().map((entry) => entry.post.name)
    expect(new Set(names).size).toBe(names.length)
    expect(buckets.get('i.redd.it--image')?.[0]?.note).toBe('i.redd.it → image')
  })

  it('files the named categories first', () => {
    const buckets = selectCorpus(links, () => image, everyHost)
    for (const name of ['nsfw', 'spoiler', 'removed'])
      expect(buckets.get(name)?.length).toBeGreaterThan(0)
    expect(buckets.get('nsfw')?.[0]?.note).toMatch(/^nsfw \(/)
  })

  it('groups ordinary websites together and labels embeds with their provider', () => {
    const embed: PostMedia = {
      type: 'embed',
      poster: null,
      embed: {
        provider: 'youtube',
        title: '',
        iframeSrc: '',
        aspectRatio: 1,
        height: null,
        allow: '',
        sandbox: '',
        originalUrl: '',
      },
    }
    const buckets = selectCorpus(
      links.slice(0, 3),
      () => embed,
      () => false,
    )
    expect([...buckets.keys()]).toContain('other-site--embed-youtube')
  })

  it('files unparseable URLs under their own name', () => {
    const broken = {
      ...links[0]!,
      url: 'not a url',
      url_overridden_by_dest: 'not a url',
    } as RedditLink
    expect([...selectCorpus([broken], () => ({ type: 'none' }), everyHost).keys()]).toContain(
      'invalid-url--none',
    )
  })
})

describe('corpus helpers', () => {
  it('describes media by type and provider', () => {
    expect(expectedOf({ type: 'none' })).toEqual({ type: 'none' })
    expect(fileName('Open.Spotify.com--embed:spotify')).toBe('open-spotify-com--embed-spotify.json')
  })
})

describe('extract-corpus CLI', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('node:fs/promises')
  })

  it('reads the raw capture and rewrites the corpus directory', async () => {
    const post = sample('Link', (v) => v.post_hint === 'image')
    const raw = JSON.stringify({
      kind: 'Listing',
      data: {
        children: [
          { kind: 't3', data: post },
          { kind: 't3', data: post },
          { kind: 't3', data: {} },
        ],
      },
    })
    const writeFile = vi.fn(async () => {})
    const rm = vi.fn(async () => {})
    const mkdir = vi.fn(async () => undefined)
    vi.doMock('node:fs/promises', () => ({
      readdir: vi.fn(async () => ['b.json', 'a.json', 'notes.txt']),
      readFile: vi.fn(async () => raw),
      writeFile,
      rm,
      mkdir,
    }))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await import('@/scripts/reddit/extract-corpus')
    await vi.waitFor(() => expect(log).toHaveBeenCalled())

    const out = path.join(process.cwd(), 'tests/media/corpus')
    expect(rm).toHaveBeenCalledWith(out, { recursive: true, force: true })
    expect(writeFile).toHaveBeenCalledWith(
      path.join(out, 'i-redd-it--image.json'),
      expect.stringContaining(String(post.name)),
    )
    expect(log).toHaveBeenCalledWith('1 buckets, 1 posts from 1')
  })

  it('exits non-zero on failure', async () => {
    vi.doMock('node:fs/promises', () => ({
      readdir: vi.fn(async () => Promise.reject(new Error('no capture'))),
    }))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await import('@/scripts/reddit/extract-corpus')
    await vi.waitFor(() => expect(error).toHaveBeenCalled())
    expect(process.exitCode).toBe(1)
    process.exitCode = 0
  })
})
