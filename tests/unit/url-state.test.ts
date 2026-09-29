import { describe, expect, it } from 'vitest'
import {
  HOME_SORTS,
  LISTING_SORTS,
  PAGE_SIZE,
  feedKey,
  nextHref,
  pageOffset,
  parseFeedQuery,
  prevHref,
  sortHref,
  usesTimeRange,
} from '@/lib/url-state'

describe('parseFeedQuery', () => {
  it('defaults everything', () => {
    expect(parseFeedQuery({})).toEqual({
      sort: 'best',
      t: 'day',
      after: null,
      before: null,
      count: 0,
    })
    expect(parseFeedQuery({}, LISTING_SORTS).sort).toBe('hot')
  })

  it('reads valid values and the first of repeated ones', () => {
    expect(
      parseFeedQuery({ sort: ['top', 'new'], t: 'week', after: 't3_abc', count: '25' }),
    ).toEqual({ sort: 'top', t: 'week', after: 't3_abc', before: null, count: 25 })
  })

  it('falls back on anything unexpected', () => {
    expect(
      parseFeedQuery(
        { sort: 'best', t: 'decade', after: 'javascript:', before: 'x', count: '-3' },
        LISTING_SORTS,
      ),
    ).toEqual({ sort: 'hot', t: 'day', after: null, before: null, count: 0 })
    expect(parseFeedQuery({ count: '1.5' }).count).toBe(0)
    expect(parseFeedQuery({ count: '20000' }).count).toBe(0)
  })

  it('takes one cursor at a time, preferring after', () => {
    expect(parseFeedQuery({ after: 't3_a', before: 't3_b' })).toMatchObject({
      after: 't3_a',
      before: null,
    })
    expect(parseFeedQuery({ before: 't3_b' })).toMatchObject({ after: null, before: 't3_b' })
  })
})

describe('offsets and keys', () => {
  const base = parseFeedQuery({})

  it('knows how many items precede the page', () => {
    expect(pageOffset(base)).toBe(0)
    expect(pageOffset({ ...base, after: 't3_a', count: 50 })).toBe(50)
    // A `before` jump carries "first index + 1".
    expect(pageOffset({ ...base, before: 't3_a', count: 51 })).toBe(25)
    expect(pageOffset({ ...base, before: 't3_a', count: 3 })).toBe(0)
  })

  it('keys the visible page by sort, range, and cursor', () => {
    expect(feedKey(base)).toBe('best:-:first')
    expect(feedKey({ ...base, sort: 'top', t: 'week', after: 't3_a' })).toBe('top:week:t3_a')
    expect(usesTimeRange('top')).toBe(true)
    expect(usesTimeRange('hot')).toBe(false)
  })
})

describe('hrefs', () => {
  const home = parseFeedQuery({})

  it('leaves the default sort and irrelevant ranges out of URLs', () => {
    expect(sortHref('/home', 'best', 'day', 'best')).toBe('/home')
    expect(sortHref('/home', 'new', 'week', 'best')).toBe('/home?sort=new')
    expect(sortHref('/r/pics', 'top', 'week', 'hot')).toBe('/r/pics?sort=top&t=week')
  })

  it('moves forward with after and a running count', () => {
    expect(nextHref('/home', home, 't3_z', 'best')).toBe(`/home?after=t3_z&count=${PAGE_SIZE}`)
    const top = { ...home, sort: 'top' as const, t: 'all' as const, after: 't3_a', count: 25 }
    expect(nextHref('/r/pics', top, 't3_z', 'hot')).toBe(
      '/r/pics?sort=top&t=all&after=t3_z&count=50',
    )
  })

  it('moves back with before, or to the first page when that is where it lands', () => {
    const page3 = { ...home, after: 't3_b', count: 50 }
    expect(prevHref('/home', page3, 't3_first', 'best')).toBe('/home?before=t3_first&count=51')
    const page2 = { ...home, sort: 'new' as const, after: 't3_a', count: 25 }
    expect(prevHref('/home', page2, 't3_first', 'best')).toBe('/home?sort=new')
  })

  it('exposes the sort lists', () => {
    expect(HOME_SORTS[0]).toBe('best')
    expect(LISTING_SORTS).not.toContain('best')
  })
})
