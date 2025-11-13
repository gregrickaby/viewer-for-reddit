import {describe, expect, it} from 'vitest'
import {formatCreatedDate} from './formatCreatedDate'

describe('formatCreatedDate', () => {
  it('should format old timestamps', () => {
    // Jan 24, 2008 (r/aww creation date from mock)
    const timestamp = 1201234022
    const result = formatCreatedDate(timestamp)
    expect(result).toMatch(/^Created \d+ years ago$/)
  })

  it('should format recent timestamps', () => {
    // 1 day ago
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400
    const result = formatCreatedDate(oneDayAgo)
    expect(result).toContain('Created')
    expect(result).toMatch(/day|hours/)
  })

  it('should format timestamps from a few months ago', () => {
    // ~3 months ago
    const threeMonthsAgo = Math.floor(Date.now() / 1000) - 90 * 86400
    const result = formatCreatedDate(threeMonthsAgo)
    expect(result).toContain('Created')
    expect(result).toMatch(/months/)
  })

  it('should include "Created" prefix', () => {
    const timestamp = 1201234022
    const result = formatCreatedDate(timestamp)
    expect(result).toMatch(/^Created /)
  })
})
