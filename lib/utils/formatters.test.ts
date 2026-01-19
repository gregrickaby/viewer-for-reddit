import {describe, expect, it} from 'vitest'
import {decodeHtmlEntities, formatNumber, formatTimeAgo} from './formatters'

describe('formatters', () => {
  describe('formatNumber', () => {
    it('formats numbers under 1000 as-is', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(42)).toBe('42')
      expect(formatNumber(999)).toBe('999')
    })

    it('formats thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatNumber(42000)).toBe('42.0K')
    })

    it('formats millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M')
      expect(formatNumber(2300000)).toBe('2.3M')
      expect(formatNumber(42000000)).toBe('42.0M')
    })
  })

  describe('formatTimeAgo', () => {
    it('formats seconds', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(formatTimeAgo(now - 5)).toBe('5s ago')
      expect(formatTimeAgo(now - 45)).toBe('45s ago')
    })

    it('formats minutes', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(formatTimeAgo(now - 60)).toBe('1m ago')
      expect(formatTimeAgo(now - 300)).toBe('5m ago')
    })

    it('formats hours', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(formatTimeAgo(now - 3600)).toBe('1h ago')
      expect(formatTimeAgo(now - 7200)).toBe('2h ago')
    })

    it('formats days', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(formatTimeAgo(now - 86400)).toBe('1d ago')
      expect(formatTimeAgo(now - 172800)).toBe('2d ago')
    })
  })

  describe('decodeHtmlEntities', () => {
    it('decodes common HTML entities', () => {
      expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>')
      expect(decodeHtmlEntities('&amp;')).toBe('&')
      expect(decodeHtmlEntities('&quot;test&quot;')).toBe('"test"')
    })

    it('decodes apostrophes', () => {
      expect(decodeHtmlEntities('&apos;')).toBe("'")
      expect(decodeHtmlEntities('&#39;')).toBe("'")
      expect(decodeHtmlEntities('&#x27;')).toBe("'")
    })

    it('decodes forward slashes', () => {
      expect(decodeHtmlEntities('&#x2F;')).toBe('/')
      expect(decodeHtmlEntities('&#47;')).toBe('/')
    })

    it('handles strings without entities', () => {
      expect(decodeHtmlEntities('plain text')).toBe('plain text')
    })

    it('handles mixed content', () => {
      expect(
        decodeHtmlEntities('&lt;a href=&quot;test&quot;&gt;link&lt;/a&gt;')
      ).toBe('<a href="test">link</a>')
    })

    it('prevents double-unescaping of entities', () => {
      // &amp;lt; should decode to &lt;, NOT to <
      expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;')
      expect(decodeHtmlEntities('&amp;gt;')).toBe('&gt;')
      expect(decodeHtmlEntities('&amp;quot;')).toBe('&quot;')
      // Verify legitimate &lt; still decodes correctly
      expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>')
    })
  })
})
