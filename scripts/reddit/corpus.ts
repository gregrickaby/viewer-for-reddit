import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'

/*
 * Picks a small, committed media corpus from the raw capture (design §13,
 * "Media detection"): real posts with the media the resolver chain produced
 * for them when captured, which the tests then hold it to.
 */

export type Expected = { type: PostMedia['type']; provider?: string }

export type CorpusEntry = {
  /** Why this post is in the corpus, e.g. `youtu.be → embed:youtube`. */
  note: string
  expected: Expected
  post: RedditLink
}

/** How many posts to keep per bucket. */
export const PER_BUCKET = 2

type Category = { name: string; matches: (link: RedditLink) => boolean }

/** Cases the acceptance list asks for by name, beyond host × media type. */
const CATEGORIES: readonly Category[] = [
  { name: 'nsfw', matches: (link) => link.over_18 },
  { name: 'spoiler', matches: (link) => link.spoiler },
  { name: 'crosspost', matches: (link) => (link.crosspost_parent_list?.length ?? 0) > 0 },
  { name: 'removed', matches: (link) => Boolean(link.removed_by_category) },
  {
    name: 'thumbnail-sentinel',
    matches: (link) =>
      ['default', 'self', 'nsfw', 'spoiler', 'image', ''].includes(link.thumbnail ?? '') &&
      !link.is_self,
  },
]

export function expectedOf(media: PostMedia): Expected {
  return media.type === 'embed'
    ? { type: 'embed', provider: media.embed.provider }
    : { type: media.type }
}

function hostOf(link: RedditLink): string {
  try {
    return new URL(link.url_overridden_by_dest ?? link.url).hostname.replace(
      /^(?:www|m|media\d?)\./,
      '',
    )
  } catch {
    return 'invalid-url'
  }
}

function label(expected: Expected): string {
  return expected.provider ? `${expected.type}:${expected.provider}` : expected.type
}

/**
 * Up to `PER_BUCKET` posts for every (host, media) pair and every named
 * category, in capture order, each post used once.
 */
export function selectCorpus(
  links: readonly RedditLink[],
  resolve: (link: RedditLink) => PostMedia,
  /** Media hosts get their own buckets; every other website shares one. */
  isMediaHost: (host: string) => boolean,
): Map<string, CorpusEntry[]> {
  const buckets = new Map<string, CorpusEntry[]>()
  const used = new Set<string>()

  const add = (bucket: string, note: string, link: RedditLink, expected: Expected) => {
    const entries = buckets.get(bucket) ?? []
    if (entries.length >= PER_BUCKET || used.has(link.name)) return
    used.add(link.name)
    buckets.set(bucket, [...entries, { note, expected, post: link }])
  }

  for (const link of links) {
    const expected = expectedOf(resolve(link))
    const category = CATEGORIES.find((candidate) => candidate.matches(link))
    if (category)
      add(category.name, `${category.name} (${hostOf(link)} → ${label(expected)})`, link, expected)
    const host = isMediaHost(hostOf(link)) ? hostOf(link) : 'other-site'
    add(
      `${host}--${label(expected).replace(':', '-')}`,
      `${host} → ${label(expected)}`,
      link,
      expected,
    )
  }
  return buckets
}

/** A file-system-safe bucket name. */
export function fileName(bucket: string): string {
  return `${bucket
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')}.json`
}
