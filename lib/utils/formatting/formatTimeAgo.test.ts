import {formatTimeAgo} from './formatTimeAgo'

describe('formatTimeAgo', () => {
  const now = Math.floor(Date.now() / 1000)

  it('returns "a few seconds ago" for less than a minute', () => {
    expect(formatTimeAgo(now - 10)).toBe('a few seconds ago')
  })

  it('returns minutes ago for less than an hour', () => {
    expect(formatTimeAgo(now - 120)).toBe('2 minutes ago')
  })

  it('returns hours ago for less than a day', () => {
    expect(formatTimeAgo(now - 7200)).toBe('2 hours ago')
  })

  it('returns days ago for less than a month', () => {
    expect(formatTimeAgo(now - 172800)).toBe('2 days ago')
  })

  it('returns months ago for less than a year', () => {
    expect(formatTimeAgo(now - 5184000)).toBe('2 months ago')
  })

  it('returns years ago for more than a year', () => {
    expect(formatTimeAgo(now - 63072000)).toBe('2 years ago')
  })
})
