import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { requireAuth } from '@/lib/auth/session'
import { redditFetch } from '@/lib/reddit/client'
import { RedditError } from '@/lib/reddit/errors'
import {
  THREADS_PER_SOURCE,
  THREAD_SOURCES,
  captures,
  type Capture,
} from '@/scripts/reddit/manifest'
import { scrub, scrubMe } from '@/scripts/reddit/scrub'

/*
 * Development-only fixture capture (docs/implementation.md §2.2). Visit
 * https://localhost:3000/api/dev/capture while signed in. The token never leaves the
 * server. Writes scrubbed JSON to fixtures/reddit/raw/. Returns 404 outside `next dev`.
 */

const OUT_DIR = path.join(process.cwd(), 'fixtures', 'reddit', 'raw')
/** Spacing between requests keeps us well inside Reddit's per-minute budget. */
const DELAY_MS = 650

type Result = { name: string; ok: boolean; error?: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Pull `{ id }` of posts from a Listing, tolerant of shape (this is dev tooling, pre-schema). */
function postIds(listing: unknown, limit: number): string[] {
  if (!isRecord(listing) || !isRecord(listing.data) || !Array.isArray(listing.data.children)) {
    return []
  }
  return listing.data.children
    .flatMap((child: unknown) =>
      isRecord(child) && isRecord(child.data) && typeof child.data.id === 'string'
        ? [child.data.id]
        : [],
    )
    .slice(0, limit)
}

/** Find the first `more` node with children anywhere in a comment thread. */
function findMore(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMore(item)
      if (found) return found
    }
    return null
  }
  if (!isRecord(value)) return null
  if (value.kind === 'more' && isRecord(value.data) && Array.isArray(value.data.children)) {
    const children = value.data.children.filter((c): c is string => typeof c === 'string')
    if (children.length > 0) return children
  }
  for (const nested of Object.values(value)) {
    const found = findMore(nested)
    if (found) return found
  }
  return null
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 })
  }

  const { accessToken, username } = await requireAuth()
  await mkdir(OUT_DIR, { recursive: true })

  const results: Result[] = []
  const captured = new Map<string, unknown>()

  async function run(capture: Capture): Promise<unknown> {
    try {
      const json = await redditFetch(capture.path, { token: accessToken, query: capture.query })
      const clean = capture.name === 'me' ? scrubMe(json, username) : scrub(json, username)
      await writeFile(
        path.join(OUT_DIR, `${capture.name}.json`),
        `${JSON.stringify(clean, null, 2)}\n`,
      )
      results.push({ name: capture.name, ok: true })
      captured.set(capture.name, json)
      return json
    } catch (error) {
      const message =
        error instanceof RedditError ? `${error.name}: ${error.message}` : String(error)
      results.push({ name: capture.name, ok: false, error: message })
      return null
    } finally {
      await sleep(DELAY_MS)
    }
  }

  for (const capture of captures(username)) {
    await run(capture)
  }

  // Comment threads for top posts, plus one /api/morechildren sample.
  let moreSample: { linkId: string; children: string[] } | null = null
  for (const source of THREAD_SOURCES) {
    for (const id of postIds(captured.get(source), THREADS_PER_SOURCE)) {
      const thread = await run({
        name: `comments-${id}`,
        path: `/comments/${id}`,
        query: { limit: 500, depth: 10, sort: 'confidence' },
      })
      if (!moreSample) {
        const children = findMore(thread)
        if (children) moreSample = { linkId: `t3_${id}`, children: children.slice(0, 100) }
      }
    }
  }
  if (moreSample) {
    await run({
      name: 'morechildren',
      path: '/api/morechildren',
      query: {
        api_type: 'json',
        link_id: moreSample.linkId,
        children: moreSample.children.join(','),
        limit_children: 'false',
        sort: 'confidence',
      },
    })
  }

  const failed = results.filter((r) => !r.ok)
  return Response.json({
    written: results.length - failed.length,
    failed,
    outDir: path.relative(process.cwd(), OUT_DIR),
  })
}
