import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  collectCandidates,
  extractThings,
  prepare,
  selectSamples,
  shapeFeatures,
  walk,
  type Json,
  type JsonObject,
} from '@/scripts/reddit/things'

const link = (id: string, extra: JsonObject = {}): JsonObject => ({
  id,
  name: `t3_${id}`,
  title: 't',
  ...extra,
})
const thing = (kind: string, data: JsonObject) => ({ kind, data })

describe('prepare', () => {
  it('flattens comment replies and crosspost parents, and extracts media_metadata items', () => {
    const extras: Array<[string, JsonObject]> = []
    const add = (dir: string, sample: JsonObject) => extras.push([dir, sample])

    expect(prepare('t1', { id: 'c', replies: { kind: 'Listing' } }, add)).toEqual({
      id: 'c',
      replies: '',
    })
    expect(prepare('t3', { id: 'p', crosspost_parent_list: [{ id: 'x' }] }, add)).toEqual({
      id: 'p',
      crosspost_parent_list: [],
    })
    expect(
      prepare(
        't3',
        { id: 'g', media_metadata: { abc: { status: 'valid', e: 'Image' }, bad: 3 } },
        add,
      ),
    ).toEqual({ id: 'g', media_metadata: {} })
    expect(extras).toEqual([['MediaMetadataItem', { status: 'valid', e: 'Image' }]])
  })

  it('leaves other kinds untouched', () => {
    expect(prepare('t5', { id: 's', replies: 'x' }, () => {})).toEqual({ id: 's', replies: 'x' })
  })
})

describe('walk', () => {
  it('visits known kinds at any depth and ignores unknown kinds and malformed things', () => {
    const seen: string[] = []
    const json: Json = {
      kind: 'Listing',
      data: {
        children: [
          thing('t3', { id: 'a' }),
          thing('t1', {
            id: 'b',
            replies: { kind: 'Listing', data: { children: [thing('more', { id: 'm' })] } },
          }),
          thing('t9', { id: 'unknown' }),
          { kind: 't3', data: 'not-an-object' },
        ],
      },
    }
    walk(json, (kind, data) => seen.push(`${kind}:${String(data.id)}`))
    expect(seen).toEqual(['t3:a', 't1:b', 'more:m'])
  })
})

describe('shapeFeatures', () => {
  it('records types, absent fields, array items, and collapses id-keyed maps', () => {
    const a = { id: 'a', edited: false, tags: ['x'], gildings: { gid_1: 1 } }
    const b = { id: 'b', edited: 12.5, extra: null, gildings: { gid_2: 2 } }
    const features = shapeFeatures(a, [a, b])
    expect(features).toContain('$.edited:boolean')
    expect(features).toContain('$.tags[]:string')
    expect(features).toContain('$.extra:absent')
    expect(features).toContain('$.gildings.*:number')
    expect([...features].some((f) => f.includes('gid_1'))).toBe(false)
  })

  it('stops descending past the maximum depth', () => {
    const deep: JsonObject = { a: { b: { c: { d: { e: { f: { g: { h: 1 } } } } } } } }
    const features = shapeFeatures(deep, [deep])
    expect([...features].some((f) => f.includes('.h'))).toBe(false)
  })
})

describe('selectSamples', () => {
  it('keeps the baseline, then only samples that add a shape feature', () => {
    const samples = [
      link('1'),
      link('2'),
      link('3'),
      link('4', { preview: { enabled: true } }),
      link('5'),
      link('6', { edited: 3 }),
    ]
    const { selected } = selectSamples(samples, { baseline: 2 })
    expect(selected.map((s) => s.id)).toEqual(['1', '2', '4', '6'])
  })

  it('never exceeds the cap', () => {
    const samples = Array.from({ length: 10 }, (_, i) => link(String(i), { [`k${i}`]: i }))
    expect(selectSamples(samples, { baseline: 0, max: 3 }).selected).toHaveLength(3)
  })
})

describe('collectCandidates', () => {
  it('buckets by kind, de-duplicates by id, and handles me.json and media_metadata', () => {
    const files = [
      {
        name: 'feed.json',
        json: {
          kind: 'Listing',
          data: {
            children: [
              thing('t3', link('a', { media_metadata: { m1: { status: 'valid' } } })),
              thing('t3', link('a')),
              thing('t5', { display_name: 'pics' }),
            ],
          },
        },
      },
      { name: 'me.json', json: { name: 'fixture_user', id: 'u1' } },
      { name: 'multis.json', json: [thing('LabeledMulti', { path: '/user/x/m/dev' })] },
    ]
    const buckets = collectCandidates(files as Array<{ name: string; json: Json }>)
    expect(buckets.get('Link')?.map((s) => s.id)).toEqual(['a'])
    expect(buckets.get('MediaMetadataItem')).toEqual([{ status: 'valid' }])
    expect(buckets.get('Subreddit')).toHaveLength(1)
    expect(buckets.get('Me')).toEqual([{ name: 'fixture_user', id: 'u1' }])
    expect(buckets.get('LabeledMulti')).toEqual([{ path: '/user/x/m/dev' }])
  })
})

describe('extractThings', () => {
  let root: string
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'rv-things-'))
  })
  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('writes one directory of numbered samples per kind', async () => {
    const rawDir = path.join(root, 'raw')
    const outDir = path.join(root, 'things')
    const schemaDir = path.join(root, 'schemas')
    await import('node:fs/promises').then((fs) => fs.mkdir(rawDir))
    await writeFile(
      path.join(rawDir, 'feed.json'),
      JSON.stringify({
        kind: 'Listing',
        data: { children: [thing('t3', link('a')), thing('t1', { id: 'c' })] },
      }),
    )
    await writeFile(path.join(rawDir, 'notes.txt'), 'ignored')
    const log = vi.fn()

    const results = await extractThings({ rawDir, outDir, schemaDir, log })

    expect([...results.keys()]).toEqual(['Comment', 'Link'])
    expect(await readdir(path.join(outDir, 'Link'))).toEqual(['0000.json'])
    expect(
      JSON.parse(await readFile(path.join(outDir, 'Link', '0000.json'), 'utf8')),
    ).toMatchObject({ id: 'a' })
    expect(await readdir(schemaDir)).toEqual([])
    expect(log).toHaveBeenCalledTimes(2)
  })

  it('fails clearly when nothing has been captured', async () => {
    await expect(
      extractThings({
        rawDir: path.join(root, 'missing'),
        outDir: root,
        schemaDir: root,
        log: vi.fn(),
      }),
    ).rejects.toThrow(/Capture them first/)
  })
})
