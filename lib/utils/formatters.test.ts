import {describe, expect, it} from 'vitest'
import {
  convertImageLinksToImages,
  decodeHtmlEntities,
  formatNumber,
  formatTimeAgo,
  sanitizeText
} from './formatters'

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

    it('formats years', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(formatTimeAgo(now - 31536000)).toBe('1y ago')
      expect(formatTimeAgo(now - 63072000)).toBe('2y ago')
      expect(formatTimeAgo(now - 77760000)).toBe('2y ago') // 900 days = 2.46 years
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

    it('uses server-side fallback when document is unavailable', () => {
      const originalDocument = globalThis.document

      Object.defineProperty(globalThis, 'document', {
        value: undefined,
        configurable: true
      })

      try {
        expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>')
        expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;')
      } finally {
        Object.defineProperty(globalThis, 'document', {
          value: originalDocument,
          configurable: true
        })
      }
    })
  })

  describe('sanitizeText', () => {
    it('allows img tags with proper attributes', () => {
      const html = '<img src="https://example.com/image.gif" alt="test" />'
      const result = sanitizeText(html)
      expect(result).toContain('<img')
      expect(result).toContain('src="https://example.com/image.gif"')
      expect(result).toContain('alt="test"')
    })

    it('strips disallowed img attributes', () => {
      const html =
        '<img src="https://example.com/image.gif" onclick="alert()" />'
      const result = sanitizeText(html)
      expect(result).toContain('<img')
      expect(result).not.toContain('onclick')
    })

    it('only allows http/https schemes for images', () => {
      const validImg = '<img src="https://example.com/image.gif" />'
      const invalidImg = '<img src="javascript:alert()" />'

      const validResult = sanitizeText(validImg)
      const invalidResult = sanitizeText(invalidImg)

      expect(validResult).toContain('<img')
      expect(invalidResult).not.toContain('javascript')
    })

    it('allows standard HTML elements', () => {
      const html = '<p>test <strong>bold</strong> <a href="#">link</a></p>'
      const result = sanitizeText(html)
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<a')
    })

    it('removes script tags', () => {
      const html = '<p>test</p><script>alert("xss")</script>'
      const result = sanitizeText(html)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('alert')
    })

    it('converts image links to img tags', () => {
      const html =
        '<a href="https://preview.redd.it/image.jpg">https://preview.redd.it/image.jpg</a>'
      const result = sanitizeText(html)
      expect(result).toContain('<img')
      expect(result).toContain('src="https://preview.redd.it/image.jpg"')
      expect(result).not.toContain('<a')
    })

    it('converts gifv links to gif images', () => {
      const html =
        '<a href="https://i.imgur.com/image.gifv">https://i.imgur.com/image.gifv</a>'
      const result = sanitizeText(html)
      expect(result).toContain('<img')
      expect(result).toContain('src="https://i.imgur.com/image.gif"')
      expect(result).not.toContain('.gifv')
    })

    it('preserves links with meaningful text', () => {
      const html = '<a href="https://example.com/image.jpg">Click here</a>'
      const result = sanitizeText(html)
      expect(result).toContain('<a')
      expect(result).toContain('Click here')
      expect(result).not.toContain('<img')
    })
  })

  describe('convertImageLinksToImages', () => {
    it('converts links with URL as text to images', () => {
      const html =
        '<a href="https://preview.redd.it/image.jpg">https://preview.redd.it/image.jpg</a>'
      const result = convertImageLinksToImages(html)
      expect(result).toContain('<img')
      expect(result).toContain('src="https://preview.redd.it/image.jpg"')
    })

    it('converts links with empty text to images', () => {
      const html = '<a href="https://i.redd.it/image.png"></a>'
      const result = convertImageLinksToImages(html)
      expect(result).toContain('<img')
      expect(result).toContain('src="https://i.redd.it/image.png"')
    })

    it('converts gifv to gif', () => {
      const html =
        '<a href="https://i.imgur.com/test.gifv">https://i.imgur.com/test.gifv</a>'
      const result = convertImageLinksToImages(html)
      expect(result).toContain('src="https://i.imgur.com/test.gif"')
      expect(result).not.toContain('.gifv')
    })

    it('keeps links with descriptive text', () => {
      const html = '<a href="https://example.com/pic.jpg">Check this out</a>'
      const result = convertImageLinksToImages(html)
      expect(result).toContain('<a')
      expect(result).toContain('Check this out')
      expect(result).not.toContain('<img')
    })

    it('handles multiple image links', () => {
      const html =
        '<a href="https://i.redd.it/1.jpg">https://i.redd.it/1.jpg</a> and <a href="https://i.redd.it/2.png">https://i.redd.it/2.png</a>'
      const result = convertImageLinksToImages(html)
      expect(result).toContain('src="https://i.redd.it/1.jpg"')
      expect(result).toContain('src="https://i.redd.it/2.png"')
    })

    it('supports common image formats', () => {
      const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'gifv']
      formats.forEach((format) => {
        const html = `<a href="https://example.com/image.${format}">https://example.com/image.${format}</a>`
        const result = convertImageLinksToImages(html)
        expect(result).toContain('<img')
      })
    })
  })
})
