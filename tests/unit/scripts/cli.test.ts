import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BANNER, REQUIRED_SCHEMAS, stampGenerated } from '@/scripts/reddit/generated'
import { THREAD_SOURCES, captures } from '@/scripts/reddit/manifest'

const fullSource = REQUIRED_SCHEMAS.map((name) => `export const ${name} = z.object({})`).join('\n')

describe('stampGenerated', () => {
  it('adds the banner once', () => {
    const stamped = stampGenerated(fullSource)
    expect(stamped.startsWith(BANNER)).toBe(true)
    expect(stampGenerated(stamped)).toBe(stamped)
  })

  it('rejects output missing a required schema', () => {
    expect(() => stampGenerated('export const LinkSchema = z.object({})')).toThrow(/CommentSchema/)
  })
})

describe('capture manifest', () => {
  it('captures the signed-in user’s saved items and every thread source', () => {
    const list = captures('someone')
    const names = list.map((c) => c.name)
    expect(list.find((c) => c.name === 'saved')?.path).toBe('/user/someone/saved')
    for (const source of THREAD_SOURCES) expect(names).toContain(source)
    expect(new Set(names).size).toBe(names.length)
    // Provider samples come from search with NSFW included, not from configuration.
    expect(list.find((c) => c.name === 'site-redgifs.com')?.query).toMatchObject({
      q: 'site:redgifs.com',
      include_over_18: 'on',
    })
  })
})

describe('CLI entry points', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@/scripts/reddit/things')
    vi.doUnmock('node:fs/promises')
  })

  it('extract-things wires repository paths into extractThings', async () => {
    const extractThings = vi.fn(async () => new Map())
    vi.doMock('@/scripts/reddit/things', () => ({ extractThings }))
    await import('@/scripts/reddit/extract-things')
    const root = process.cwd()
    expect(extractThings).toHaveBeenCalledWith({
      rawDir: path.join(root, 'fixtures', 'reddit', 'raw'),
      outDir: path.join(root, 'fixtures', 'reddit', 'things'),
      schemaDir: path.join(root, 'lib', 'reddit', 'schemas'),
    })
  })

  it('extract-things exits non-zero on failure', async () => {
    vi.doMock('@/scripts/reddit/things', () => ({
      extractThings: vi.fn(async () => Promise.reject(new Error('boom'))),
    }))
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await import('@/scripts/reddit/extract-things')
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1))
    expect(error).toHaveBeenCalled()
  })

  it('postprocess-generated stamps generated.ts in place', async () => {
    const writeFile = vi.fn(async () => {})
    vi.doMock('node:fs/promises', () => ({ readFile: vi.fn(async () => fullSource), writeFile }))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await import('@/scripts/reddit/postprocess-generated')
    await vi.waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining('generated.ts OK')),
    )
    expect(writeFile).toHaveBeenCalledWith(
      path.join(process.cwd(), 'lib', 'reddit', 'schemas', 'generated.ts'),
      expect.stringContaining(BANNER),
    )
  })

  it('postprocess-generated exits non-zero when a schema is missing', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => 'export const LinkSchema = 1'),
      writeFile: vi.fn(),
    }))
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await import('@/scripts/reddit/postprocess-generated')
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1))
  })
})
