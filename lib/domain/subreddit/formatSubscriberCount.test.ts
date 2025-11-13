import {describe, expect, it} from 'vitest'
import {formatSubscriberCount} from './formatSubscriberCount'

describe('formatSubscriberCount', () => {
  it.each([
    [0, '0'],
    [1, '1'],
    [42, '42'],
    [999, '999']
  ])(
    'should format small numbers without abbreviation: %i -> %s',
    (count, expected) => {
      expect(formatSubscriberCount(count)).toBe(expected)
    }
  )

  it.each([
    [1000, '1.0K'],
    [1234, '1.2K'],
    [1500, '1.5K'],
    [10000, '10.0K'],
    [50000, '50.0K'],
    [123456, '123.5K'],
    [999000, '999.0K'],
    [999999, '1000.0K']
  ])('should format thousands with K suffix: %i -> %s', (count, expected) => {
    expect(formatSubscriberCount(count)).toBe(expected)
  })

  it.each([
    [1000000, '1.0M'],
    [1234567, '1.2M'],
    [10000000, '10.0M'],
    [37661216, '37.7M'],
    [100000000, '100.0M']
  ])('should format millions with M suffix: %i -> %s', (count, expected) => {
    expect(formatSubscriberCount(count)).toBe(expected)
  })

  it('should handle negative numbers as zero', () => {
    expect(formatSubscriberCount(-100)).toBe('0')
    expect(formatSubscriberCount(-1000)).toBe('0')
  })
})
