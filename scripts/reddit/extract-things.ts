/*
 * Buckets every `{ kind, data }` object in fixtures/reddit/raw into one directory of samples
 * per Reddit kind, so quicktype merges them into one schema per kind
 * (docs/design.md §7, docs/implementation.md §2.3).
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const RAW_DIR = path.join(process.cwd(), 'fixtures', 'reddit', 'raw')
const OUT_DIR = path.join(process.cwd(), 'fixtures', 'reddit', 'things')
const MAX_PER_KIND = 400

const KIND_DIRS: Record<string, string> = {
  t1: 'Comment',
  t2: 'Account',
  t3: 'Link',
  t5: 'Subreddit',
  more: 'More',
  LabeledMulti: 'LabeledMulti',
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

const isObject = (value: Json | undefined): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const buckets = new Map<string, Map<string, JsonObject>>()

function add(dir: string, sample: JsonObject): void {
  const bucket = buckets.get(dir) ?? new Map<string, JsonObject>()
  buckets.set(dir, bucket)
  if (bucket.size >= MAX_PER_KIND) return
  const key = String(sample.name ?? sample.id ?? sample.path ?? bucket.size)
  if (!bucket.has(key)) bucket.set(key, sample)
}

/** Recursion and nested posts are modeled by hand, so flatten them out of samples. */
function prepare(kind: string, data: JsonObject): JsonObject {
  const copy: JsonObject = { ...data }
  if (kind === 't1' && 'replies' in copy) copy.replies = ''
  if (kind === 't3' && Array.isArray(copy.crosspost_parent_list)) copy.crosspost_parent_list = []
  return copy
}

function walk(value: Json): void {
  if (Array.isArray(value)) {
    value.forEach(walk)
    return
  }
  if (!isObject(value)) return

  const kind = typeof value.kind === 'string' ? value.kind : null
  const dir = kind ? KIND_DIRS[kind] : undefined
  if (kind && dir && isObject(value.data)) {
    add(dir, prepare(kind, value.data))
  }
  // Keep descending: replies, crosspost parents, and nested subreddit objects hold more samples.
  for (const nested of Object.values(value)) walk(nested)
}

async function main(): Promise<void> {
  const files = (await readdir(RAW_DIR)).filter((file) => file.endsWith('.json')).sort()
  if (files.length === 0) {
    throw new Error(`No fixtures in ${RAW_DIR}. Capture them first: visit /api/dev/capture.`)
  }

  for (const file of files) {
    const json = JSON.parse(await readFile(path.join(RAW_DIR, file), 'utf8')) as Json
    // /api/v1/me has no kind wrapper.
    if (file === 'me.json' && isObject(json)) add('Me', json)
    walk(json)
  }

  await rm(OUT_DIR, { recursive: true, force: true })
  for (const [dir, samples] of buckets) {
    const target = path.join(OUT_DIR, dir)
    await mkdir(target, { recursive: true })
    let index = 0
    for (const sample of samples.values()) {
      await writeFile(
        path.join(target, `${String(index++).padStart(4, '0')}.json`),
        JSON.stringify(sample),
      )
    }
    console.log(`${dir.padEnd(14)} ${samples.size} samples`)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
