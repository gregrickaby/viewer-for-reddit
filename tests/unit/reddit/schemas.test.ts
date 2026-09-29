import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type * as z from 'zod'
import { Account, Me } from '@/lib/reddit/schemas/account'
import { Comment, CommentOrMore, More } from '@/lib/reddit/schemas/comment'
import { Link, crosspostParent } from '@/lib/reddit/schemas/link'
import { MediaMetadataItem } from '@/lib/reddit/schemas/media'
import { Multi, MultiThing } from '@/lib/reddit/schemas/multi'
import {
  CommentsResponse,
  EmptyResponse,
  FormError,
  FormResponse,
} from '@/lib/reddit/schemas/responses'
import { Subreddit } from '@/lib/reddit/schemas/subreddit'
import { Fullname, ListingEnvelope } from '@/lib/reddit/schemas/things'
import { RAW_DIR, sample, samples } from '@/tests/helpers/fixtures'

const CURATED: Record<string, z.ZodType> = {
  Link,
  Comment,
  More,
  Subreddit,
  Account,
  Me,
  LabeledMulti: Multi,
  MediaMetadataItem,
}

describe('curated schemas over the committed samples', () => {
  it.each(Object.entries(CURATED))('every %s sample parses', (kind, schema) => {
    const all = samples(kind)
    expect(all.length).toBeGreaterThan(0)
    for (const [index, value] of all.entries()) {
      const result = schema.safeParse(value)
      expect(result.error?.issues, `${kind} sample ${index}`).toBeUndefined()
    }
  })

  it('strips fields it does not pick', () => {
    const link = Link.parse(sample('Link'))
    expect(link).not.toHaveProperty('all_awardings')
    expect(link).toHaveProperty('title')
  })

  it('keeps media_metadata as an unparsed map so one bad entry cannot fail a post', () => {
    const gallery = sample('Link', (value) => value.is_gallery === true)
    gallery.media_metadata = { good: { status: 'valid' }, bad: 42 }
    expect(Link.parse(gallery).media_metadata).toEqual({ good: { status: 'valid' }, bad: 42 })
  })
})

describe('envelopes', () => {
  it('accepts listings with missing cursors', () => {
    expect(ListingEnvelope.parse({ kind: 'Listing', data: { children: [] } }).data).toEqual({
      children: [],
    })
  })

  it('discriminates comments from more placeholders', () => {
    const more = { kind: 'more', data: sample('More') }
    expect(CommentOrMore.parse(more).kind).toBe('more')
    expect(CommentOrMore.safeParse({ kind: 't3', data: sample('Link') }).success).toBe(false)
  })

  it('validates fullnames', () => {
    expect(Fullname.safeParse('t3_abc123').success).toBe(true)
    expect(Fullname.safeParse('t9_abc').success).toBe(false)
    expect(Fullname.safeParse('t3_ABC').success).toBe(false)
  })

  it('reads form errors with or without a field', () => {
    expect(FormError.parse(['THREAD_LOCKED', 'that thread is locked', 'parent'])).toHaveLength(3)
    expect(FormError.parse(['RATELIMIT', 'slow down'])).toHaveLength(2)
    expect(FormResponse.parse({ json: { errors: [] } }).json.data).toBeUndefined()
  })

  it('accepts empty write responses', () => {
    expect(EmptyResponse.parse({})).toEqual({})
  })
})

describe('crosspostParent', () => {
  it('parses the original post one level deep', () => {
    const original = sample('Link', (value) => value.is_video === true)
    const crosspost = sample('Link', (value) => value.is_self === false && value.id !== original.id)
    crosspost.crosspost_parent_list = [original]
    expect(crosspostParent(Link.parse(crosspost))?.id).toBe(original.id)
  })

  it('returns null without a usable parent', () => {
    const link = sample('Link')
    expect(crosspostParent(Link.parse(link))).toBeNull()
    link.crosspost_parent_list = [{ id: 'broken' }]
    expect(crosspostParent(Link.parse(link))).toBeNull()
  })
})

/*
 * Drift check against the full local capture (git-ignored, ~61 MB). It runs
 * wherever `/api/dev/capture` has been used, and is skipped on a fresh clone.
 */
describe.skipIf(!existsSync(RAW_DIR))('curated schemas over the raw capture', () => {
  const THING_SCHEMAS: Record<string, z.ZodType> = {
    t1: Comment,
    t2: Account,
    t3: Link,
    t5: Subreddit,
    more: More,
    LabeledMulti: Multi,
  }

  function* things(value: unknown): Generator<{ kind: string; data: unknown }> {
    if (Array.isArray(value)) {
      for (const item of value) yield* things(item)
    } else if (value && typeof value === 'object') {
      const node = value as Record<string, unknown>
      if (typeof node.kind === 'string' && node.kind in THING_SCHEMAS && node.data) {
        yield { kind: node.kind, data: node.data }
      }
      for (const child of Object.values(node)) yield* things(child)
    }
  }

  const files = existsSync(RAW_DIR) ? readdirSync(RAW_DIR).filter((f) => f.endsWith('.json')) : []
  const read = (file: string): unknown => JSON.parse(readFileSync(path.join(RAW_DIR, file), 'utf8'))

  it('parses every captured thing (drops below 1%)', () => {
    let total = 0
    const failures: string[] = []
    for (const file of files) {
      for (const { kind, data } of things(read(file))) {
        total += 1
        const result = THING_SCHEMAS[kind]!.safeParse(data)
        if (!result.success)
          failures.push(`${file} ${kind}: ${result.error.issues[0]?.path.join('.')}`)
      }
    }
    expect(total).toBeGreaterThan(1000)
    expect(failures.length / total, failures.slice(0, 10).join('\n')).toBeLessThan(0.01)
  })

  it('parses every response envelope', () => {
    for (const file of files) {
      const json = read(file)
      if (file.startsWith('comments-'))
        expect(CommentsResponse.safeParse(json).success, file).toBe(true)
      else if (file === 'morechildren.json')
        expect(FormResponse.safeParse(json).success, file).toBe(true)
      else if (file === 'multis-mine.json') {
        for (const multi of json as unknown[])
          expect(MultiThing.safeParse(multi).success).toBe(true)
      } else if (file === 'me.json') expect(Me.safeParse(json).success, file).toBe(true)
      else if (!file.includes('about'))
        expect(ListingEnvelope.safeParse(json).success, file).toBe(true)
    }
  })
})
