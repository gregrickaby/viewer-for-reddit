/*
 * Selects type-generation samples from captured Reddit JSON: one directory per Reddit kind,
 * which quicktype merges into one schema per kind (docs/design.md §7, docs/implementation.md §2.3).
 *
 * Selection is coverage-based rather than "first N": a sample is kept when it contributes a
 * shape feature not yet seen for its kind: a new field path, a new value type at a path, or a
 * field being *absent* where other samples have it (which is what makes quicktype mark it
 * optional). The result is small enough to commit while covering every observed variant.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export type JsonObject = { [key: string]: Json }

/** Always keep this many samples per kind so "typical" shapes are well represented. */
export const BASELINE = 15
/** Safety valve per kind. */
export const MAX_PER_KIND = 250
/** How deep shape features are computed. */
const MAX_DEPTH = 6
/** Objects keyed by ids rather than field names; their keys collapse to `*`. */
const MAP_FIELDS = new Set(['media_metadata', 'gildings'])

export const KIND_DIRS: Record<string, string> = {
  t1: 'Comment',
  t2: 'Account',
  t3: 'Link',
  t5: 'Subreddit',
  more: 'More',
  LabeledMulti: 'LabeledMulti',
}

const isObject = (value: Json | undefined): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const typeOf = (value: Json): string =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

const isMapPath = (at: string) => MAP_FIELDS.has(at.split('.').at(-1) ?? '')

type AddSample = (dir: string, sample: JsonObject) => void

/**
 * Recursion, nested posts, and id-keyed maps are modeled by hand, so flatten them out of samples.
 * `media_metadata` is a map keyed by media id; its values become their own sample kind so
 * quicktype infers one item schema instead of an object with random keys.
 */
export function prepare(kind: string, data: JsonObject, addExtra: AddSample): JsonObject {
  const copy: JsonObject = { ...data }
  if (kind === 't1' && 'replies' in copy) copy.replies = ''
  if (kind === 't3' && Array.isArray(copy.crosspost_parent_list)) copy.crosspost_parent_list = []
  if (isObject(copy.media_metadata)) {
    for (const item of Object.values(copy.media_metadata)) {
      if (isObject(item)) addExtra('MediaMetadataItem', item)
    }
    copy.media_metadata = {}
  }
  return copy
}

/** Visit every `{ kind, data }` Reddit thing anywhere in a JSON value. */
export function walk(value: Json, visit: (kind: string, data: JsonObject) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit)
    return
  }
  if (!isObject(value)) return
  const kind = typeof value.kind === 'string' ? value.kind : null
  if (kind && KIND_DIRS[kind] && isObject(value.data)) visit(kind, value.data)
  // Keep descending: replies, crosspost parents, and nested objects hold more samples.
  for (const nested of Object.values(value)) walk(nested, visit)
}

/** For each object path, every key ever seen there. */
type KeyUnion = Map<string, Set<string>>

function collectKeys(value: Json, at: string, union: KeyUnion, depth = 0): void {
  if (depth > MAX_DEPTH) return
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, `${at}[]`, union, depth + 1)
    return
  }
  if (!isObject(value)) return
  const keys = union.get(at) ?? new Set<string>()
  union.set(at, keys)
  const isMap = isMapPath(at)
  for (const [key, child] of Object.entries(value)) {
    const name = isMap ? '*' : key
    keys.add(name)
    collectKeys(child, `${at}.${name}`, union, depth + 1)
  }
}

function features(value: Json, at: string, union: KeyUnion, out: Set<string>, depth = 0): void {
  out.add(`${at}:${typeOf(value)}`)
  if (depth > MAX_DEPTH) return
  if (Array.isArray(value)) {
    for (const item of value) features(item, `${at}[]`, union, out, depth + 1)
    return
  }
  if (!isObject(value)) return
  if (isMapPath(at)) {
    for (const child of Object.values(value)) features(child, `${at}.*`, union, out, depth + 1)
    return
  }
  for (const key of union.get(at) ?? []) {
    const child = value[key]
    if (child === undefined) out.add(`${at}.${key}:absent`)
    else features(child, `${at}.${key}`, union, out, depth + 1)
  }
}

/** Shape features of one sample relative to every sample of its kind (exported for tests). */
export function shapeFeatures(sample: JsonObject, all: JsonObject[]): Set<string> {
  const union: KeyUnion = new Map()
  for (const item of all) collectKeys(item, '$', union)
  const out = new Set<string>()
  features(sample, '$', union, out)
  return out
}

export type Selection = { selected: JsonObject[]; features: number }

/** Keep the baseline, then any sample that adds a shape feature, up to the cap. */
export function selectSamples(
  samples: JsonObject[],
  { baseline = BASELINE, max = MAX_PER_KIND } = {},
): Selection {
  const union: KeyUnion = new Map()
  for (const sample of samples) collectKeys(sample, '$', union)

  const seen = new Set<string>()
  const selected: JsonObject[] = []
  for (const sample of samples) {
    if (selected.length >= max) break
    const own = new Set<string>()
    features(sample, '$', union, own)
    if (selected.length < baseline || [...own].some((feature) => !seen.has(feature))) {
      selected.push(sample)
      for (const feature of own) seen.add(feature)
    }
  }
  return { selected, features: seen.size }
}

function identity(sample: JsonObject): string | null {
  const id = sample.name ?? sample.id ?? sample.path
  return typeof id === 'string' ? id : null
}

/** Every sample per sample-directory, de-duplicated by Reddit id. `me.json` has no kind wrapper. */
export function collectCandidates(
  files: Array<{ name: string; json: Json }>,
): Map<string, JsonObject[]> {
  const buckets = new Map<string, Map<string, JsonObject>>()
  const add: AddSample = (dir, sample) => {
    const bucket = buckets.get(dir) ?? new Map<string, JsonObject>()
    buckets.set(dir, bucket)
    const key = identity(sample) ?? `#${bucket.size}`
    if (!bucket.has(key)) bucket.set(key, sample)
  }
  for (const { name, json } of files) {
    if (name === 'me.json' && isObject(json)) add('Me', json)
    walk(json, (kind, data) => add(KIND_DIRS[kind]!, prepare(kind, data, add)))
  }
  return new Map([...buckets].map(([dir, bucket]) => [dir, [...bucket.values()]]))
}

export type ExtractOptions = {
  rawDir: string
  outDir: string
  schemaDir: string
  log?: (line: string) => void
}

/** Read raw fixtures, select samples, and write `<outDir>/<Kind>/<nnnn>.json`. */
export async function extractThings({
  rawDir,
  outDir,
  schemaDir,
  log = console.log,
}: ExtractOptions): Promise<Map<string, Selection>> {
  const names = (await readdir(rawDir).catch(() => [] as string[]))
    .filter((file) => file.endsWith('.json'))
    .sort()
  if (names.length === 0) {
    throw new Error(`No fixtures in ${rawDir}. Capture them first: visit /api/dev/capture.`)
  }

  const files = await Promise.all(
    names.map(async (name) => ({
      name,
      json: JSON.parse(await readFile(path.join(rawDir, name), 'utf8')) as Json,
    })),
  )
  const candidates = collectCandidates(files)

  await rm(outDir, { recursive: true, force: true })
  await mkdir(schemaDir, { recursive: true })

  const results = new Map<string, Selection>()
  for (const [dir, samples] of [...candidates].sort(([a], [b]) => a.localeCompare(b))) {
    const selection = selectSamples(samples)
    results.set(dir, selection)
    const target = path.join(outDir, dir)
    await mkdir(target, { recursive: true })
    await Promise.all(
      selection.selected.map((sample, index) =>
        writeFile(
          path.join(target, `${String(index).padStart(4, '0')}.json`),
          `${JSON.stringify(sample)}\n`,
        ),
      ),
    )
    log(
      `${dir.padEnd(18)} ${String(selection.selected.length).padStart(4)} of ${String(samples.length).padStart(5)} samples, ${selection.features} shape features`,
    )
  }
  return results
}
