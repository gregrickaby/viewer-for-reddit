/*
 * npm run media:corpus — rebuilds tests/media/corpus from fixtures/reddit/raw.
 * Runs with the `react-server` condition (so `server-only` modules load) and
 * .env.local (the Twitch embed needs BASE_URL). Review the diff before committing:
 * a changed `expected` is a behavior change in media detection.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { resolveMedia } from '@/lib/media/detect'
import { findProvider } from '@/lib/media/providers/registry'
import { REDDIT_MEDIA_HOSTS, hostMatches } from '@/lib/media/url'
import { Link, type RedditLink } from '@/lib/reddit/schemas/link'
import { fileName, selectCorpus } from './corpus'

const RAW = path.join(process.cwd(), 'fixtures/reddit/raw')
const OUT = path.join(process.cwd(), 'tests/media/corpus')

function* links(value: unknown, seen: Set<string>): Generator<RedditLink> {
  if (Array.isArray(value)) {
    for (const item of value) yield* links(item, seen)
  } else if (value && typeof value === 'object') {
    const node = value as { kind?: unknown; data?: unknown }
    if (node.kind === 't3') {
      const parsed = Link.safeParse(node.data)
      if (parsed.success && !seen.has(parsed.data.name)) {
        seen.add(parsed.data.name)
        yield parsed.data
      }
    }
    for (const child of Object.values(value)) yield* links(child, seen)
  }
}

async function main() {
  const seen = new Set<string>()
  const all: RedditLink[] = []
  for (const file of (await readdir(RAW)).filter((name) => name.endsWith('.json')).sort()) {
    all.push(...links(JSON.parse(await readFile(path.join(RAW, file), 'utf8')), seen))
  }
  const info = console.info
  console.info = () => {}
  const isMediaHost = (host: string) =>
    host === 'reddit.com' ||
    hostMatches(host, REDDIT_MEDIA_HOSTS) ||
    findProvider(new URL(`https://${host}/`)) !== null
  const buckets = selectCorpus(all, resolveMedia, isMediaHost)
  console.info = info

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  for (const [bucket, entries] of buckets) {
    await writeFile(path.join(OUT, fileName(bucket)), `${JSON.stringify(entries, null, 2)}\n`)
  }
  console.log(
    `${buckets.size} buckets, ${[...buckets.values()].flat().length} posts from ${all.length}`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
