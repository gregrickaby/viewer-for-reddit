import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/*
 * Committed samples from fixtures/reddit/things (one directory per kind). They
 * are real, scrubbed Reddit data selected for shape coverage, so tests look
 * them up by what they contain rather than by file name.
 */

export const THINGS_DIR = path.join(process.cwd(), 'fixtures/reddit/things')
export const RAW_DIR = path.join(process.cwd(), 'fixtures/reddit/raw')

export type Sample = Record<string, unknown>

const cache = new Map<string, Sample[]>()

export function samples(kind: string): Sample[] {
  let loaded = cache.get(kind)
  if (!loaded) {
    const dir = path.join(THINGS_DIR, kind)
    loaded = readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as Sample)
    cache.set(kind, loaded)
  }
  // Deep copies, so a test can modify its sample freely.
  return loaded.map((sample) => structuredClone(sample))
}

/** The first sample of `kind` matching `predicate`; throws if the corpus has none. */
export function sample(kind: string, predicate: (value: Sample) => boolean = () => true): Sample {
  const found = samples(kind).find(predicate)
  if (!found) throw new Error(`No ${kind} sample matches ${predicate.toString()}`)
  return found
}
