import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { resolveMedia } from '@/lib/media/detect'
import { Link } from '@/lib/reddit/schemas/link'
import { type CorpusEntry, expectedOf } from '@/scripts/reddit/corpus'

/*
 * Real captured posts (npm run media:corpus) and the media each one resolved
 * to when captured. A failure here means detection changed: check whether the
 * new result is better, then regenerate and review the corpus diff.
 */

const DIR = path.join(process.cwd(), 'tests/media/corpus')
const files = readdirSync(DIR).filter((file) => file.endsWith('.json'))
const corpus = files.flatMap((file) =>
  (JSON.parse(readFileSync(path.join(DIR, file), 'utf8')) as CorpusEntry[]).map(
    (entry) => [file, entry] as const,
  ),
)

describe('media corpus', () => {
  it('covers every provider and the named cases, with at least two posts each', () => {
    const names = files.map((file) => file.replace(/\.json$/, ''))
    for (const provider of [
      'youtube',
      'vimeo',
      'streamable',
      'twitch',
      'redgifs',
      'imgur',
      'tiktok',
      'spotify',
      'soundcloud',
    ]) {
      const posts = corpus.filter(([, entry]) => entry.expected.provider === provider)
      expect(posts.length, provider).toBeGreaterThanOrEqual(2)
    }
    for (const name of [
      'nsfw',
      'spoiler',
      'crosspost',
      'removed',
      'thumbnail-sentinel',
      'reddit-com--gallery',
      'v-redd-it--video',
      'v-redd-it--animated',
      'i-imgur-com--animated',
      'giphy-com--animated',
    ]) {
      expect(names, name).toContain(name)
    }
  })

  it.each(corpus.map(([file, entry]) => [`${file}: ${entry.note}`, entry] as const))(
    '%s',
    (_, entry) => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => {})
      const post = Link.parse(entry.post)
      expect(expectedOf(resolveMedia(post))).toEqual(entry.expected)
      info.mockRestore()
    },
  )

  it('leaves under 2% of posts unresolved', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    for (const [, entry] of corpus) resolveMedia(Link.parse(entry.post))
    expect(info.mock.calls.length / corpus.length).toBeLessThan(0.02)
  })
})
