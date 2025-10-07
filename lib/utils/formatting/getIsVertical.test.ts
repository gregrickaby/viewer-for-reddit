import {getIsVertical} from './getIsVertical'

describe('getIsVertical', () => {
  it('returns true if height > width', () => {
    expect(getIsVertical(100, 200)).toBe(true)
  })

  it('returns false if width > height', () => {
    expect(getIsVertical(200, 100)).toBe(false)
  })

  it('returns false if width === height', () => {
    expect(getIsVertical(100, 100)).toBe(false)
  })

  it('returns false if width is undefined', () => {
    expect(getIsVertical(undefined, 100)).toBe(false)
  })

  it('returns false if height is undefined', () => {
    expect(getIsVertical(100, undefined)).toBe(false)
  })

  it('returns false if both are undefined', () => {
    expect(getIsVertical(undefined, undefined)).toBe(false)
  })
})
