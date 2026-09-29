import { describe, expect, it } from 'vitest'
import { absoluteTime, compactNumber, isoTime, plural, timeAgo } from '@/lib/format'

describe('compactNumber', () => {
  it.each([
    [0, '0'],
    [950, '950'],
    [-12, '-12'],
    [1200, '1.2k'],
    [34_000, '34k'],
    [1_500_000, '1.5m'],
  ])('%d → %s', (value, expected) => {
    expect(compactNumber(value)).toBe(expected)
  })
})

describe('timeAgo', () => {
  const now = 1_700_000_000_000
  const ago = (seconds: number) => timeAgo(now / 1000 - seconds, now)

  it.each([
    [0, 'now'],
    [59, 'now'],
    [60, '1m'],
    [3599, '59m'],
    [3600, '1h'],
    [86_400 * 2, '2d'],
    [86_400 * 45, '1mo'],
    [86_400 * 800, '2y'],
  ])('%ds → %s', (seconds, expected) => {
    expect(ago(seconds)).toBe(expected)
  })

  it('treats future times as now', () => {
    expect(ago(-100)).toBe('now')
  })
})

describe('timestamps and plurals', () => {
  it('formats absolute times in UTC', () => {
    expect(absoluteTime(0)).toBe('Jan 1, 1970, 12:00 AM UTC')
    expect(isoTime(0)).toBe('1970-01-01T00:00:00.000Z')
  })

  it('pluralizes compact counts', () => {
    expect(plural(1, 'comment')).toBe('1 comment')
    expect(plural(0, 'comment')).toBe('0 comments')
    expect(plural(2300, 'comment')).toBe('2.3k comments')
  })
})
