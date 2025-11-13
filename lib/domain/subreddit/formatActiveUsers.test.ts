import {describe, expect, it} from 'vitest'
import {formatActiveUsers} from './formatActiveUsers'

describe('formatActiveUsers', () => {
  it('should return fallback message for undefined', () => {
    expect(formatActiveUsers(undefined)).toBe('Data unavailable')
  })

  it.each([
    [0, '0 online'],
    [1, '1 online'],
    [565, '565 online'],
    [1234, '1,234 online'],
    [10000, '10,000 online'],
    [1000000, '1,000,000 online']
  ])('should format active user count: %i -> %s', (count, expected) => {
    expect(formatActiveUsers(count)).toBe(expected)
  })
})
