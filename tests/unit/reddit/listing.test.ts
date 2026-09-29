import { describe, expect, it, vi } from 'vitest'
import * as z from 'zod'
import { RedditSchemaError } from '@/lib/reddit/errors'
import { parseItems, parseListing, parseResponse } from '@/lib/reddit/listing'

const Item = z.object({ kind: z.literal('t3'), data: z.object({ id: z.string() }) })
const listing = (children: unknown[], cursors: object = { after: 't3_z', before: null }) => ({
  kind: 'Listing',
  data: { ...cursors, children },
})

describe('parseListing', () => {
  it('returns items and cursors', () => {
    expect(parseListing(listing([{ kind: 't3', data: { id: 'a' } }]), Item, '/best')).toEqual({
      items: [{ kind: 't3', data: { id: 'a' } }],
      after: 't3_z',
      before: null,
    })
  })

  it('defaults missing cursors to null', () => {
    expect(parseListing(listing([], {}), Item, '/best')).toEqual({
      items: [],
      after: null,
      before: null,
    })
  })

  it('drops and logs a bad item without failing the page', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = parseListing(
      listing([
        { kind: 't3', data: { id: 'a' } },
        { kind: 't3', data: { name: 't3_bad', id: 7 } },
        { kind: 't1', data: {} },
        'text',
        { data: null },
      ]),
      Item,
      '/best',
    )
    expect(result.items).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(4)
    expect(warn.mock.calls.map((call) => call[2])).toEqual(['t3 t3_bad', 't1 ?', 'string', '? ?'])
  })

  it('throws a schema error for a bad envelope', () => {
    expect(() => parseListing({ kind: 'Listing' }, Item, '/best')).toThrow(RedditSchemaError)
    expect(() => parseListing('<html>', Item, '/best')).toThrow(/\/best/)
  })
})

describe('parseItems', () => {
  it('parses a bare array of things', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(
      parseItems([{ kind: 't3', data: { id: 'a' } }, null], Item, '/api/multi/mine'),
    ).toHaveLength(1)
  })
})

describe('parseResponse', () => {
  it('returns the parsed value or throws with the endpoint', () => {
    expect(parseResponse({ kind: 't3', data: { id: 'a' } }, Item, '/x')).toEqual({
      kind: 't3',
      data: { id: 'a' },
    })
    expect(() => parseResponse({}, Item, '/x')).toThrow(RedditSchemaError)
  })
})
