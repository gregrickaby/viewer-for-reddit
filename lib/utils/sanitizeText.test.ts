import {sanitizeText} from './sanitizeText'

describe('sanitizeText', () => {
  it('removes disallowed tags', () => {
    expect(sanitizeText('<script>alert(1)</script><b>bold</b>')).toBe(
      '<b>bold</b>'
    )
  })

  it('allows allowed tags and attributes', () => {
    expect(sanitizeText('<a href="/foo" target="_blank">link</a>')).toBe(
      '<a href="/foo" target="_blank">link</a>'
    )
  })

  it('removes disallowed attributes', () => {
    expect(sanitizeText('<a href="/foo" onclick="evil()">link</a>')).toBe(
      '<a href="/foo">link</a>'
    )
  })

  it('does not decode entities by default', () => {
    expect(sanitizeText('foo &amp; bar')).toBe('foo &amp; bar')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(sanitizeText(undefined as any)).toBe('')
  })
})
