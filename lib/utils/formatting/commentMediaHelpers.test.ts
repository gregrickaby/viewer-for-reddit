import {describe, expect, it} from 'vitest'
import {
  extractMediaLinks,
  getMediaType,
  isMediaUrl,
  normalizeMediaUrl,
  stripMediaLinks
} from './commentMediaHelpers'

describe('commentMediaHelpers', () => {
  describe('isMediaUrl', () => {
    it.each([
      ['https://i.redd.it/abc123.jpg', true],
      ['https://i.imgur.com/abc123.png', true],
      ['https://i.imgur.com/abc123.gif', true],
      ['https://imgur.com/abc123.gifv', true],
      ['https://v.redd.it/abc123.mp4', true],
      ['https://gfycat.com/adorablecat', true],
      ['https://redgifs.com/watch/adorablecat', true],
      ['https://example.com/image.jpg', true],
      ['https://example.com/video.mp4', true],
      ['https://example.com', false],
      ['https://reddit.com/r/cats', false],
      ['not-a-url', false]
    ])('should detect if %s is media URL: %s', (url, expected) => {
      expect(isMediaUrl(url)).toBe(expected)
    })
  })

  describe('getMediaType', () => {
    it.each([
      ['https://i.redd.it/abc.jpg', 'image'],
      ['https://i.imgur.com/abc.png', 'image'],
      ['https://example.com/photo.jpeg', 'image'],
      ['https://example.com/photo.webp', 'image'],
      ['https://i.imgur.com/abc.gif', 'video'],
      ['https://imgur.com/abc.gifv', 'video'],
      ['https://v.redd.it/abc.mp4', 'video'],
      ['https://example.com/clip.webm', 'video'],
      ['https://gfycat.com/adorablecat', 'video'],
      ['https://redgifs.com/watch/cat', 'video'],
      ['https://i.redd.it/noext', 'image'],
      ['https://example.com', 'unknown']
    ])('should detect media type for %s as %s', (url, expected) => {
      expect(getMediaType(url)).toBe(expected)
    })
  })

  describe('normalizeMediaUrl', () => {
    it('should convert imgur gifv to mp4', () => {
      expect(normalizeMediaUrl('https://i.imgur.com/abc.gifv')).toBe(
        'https://i.imgur.com/abc.mp4'
      )
    })

    it('should leave other URLs unchanged', () => {
      const url = 'https://i.redd.it/abc.jpg'
      expect(normalizeMediaUrl(url)).toBe(url)
    })

    it('should handle imgur gallery URLs', () => {
      const url = 'https://imgur.com/a/abc123'
      expect(normalizeMediaUrl(url)).toBe(url)
    })
  })

  describe('extractMediaLinks', () => {
    it('should extract media links from HTML', () => {
      const html = '<div><a href="https://i.redd.it/cat.jpg">cat pic</a></div>'
      const links = extractMediaLinks(html)

      expect(links).toHaveLength(1)
      expect(links[0]).toEqual({
        url: 'https://i.redd.it/cat.jpg',
        text: 'cat pic'
      })
    })

    it('should extract multiple media links', () => {
      const html = `
        <div>
          <a href="https://i.redd.it/cat1.jpg">cat 1</a>
          <a href="https://i.imgur.com/cat2.gif">cat 2</a>
        </div>
      `
      const links = extractMediaLinks(html)

      expect(links).toHaveLength(2)
      expect(links[0].url).toBe('https://i.redd.it/cat1.jpg')
      expect(links[1].url).toBe('https://i.imgur.com/cat2.gif')
    })

    it('should ignore non-media links', () => {
      const html = `
        <div>
          <a href="https://reddit.com">reddit</a>
          <a href="https://i.redd.it/cat.jpg">cat pic</a>
        </div>
      `
      const links = extractMediaLinks(html)

      expect(links).toHaveLength(1)
      expect(links[0].url).toBe('https://i.redd.it/cat.jpg')
    })

    it('should return empty array for no media links', () => {
      const html = '<div><a href="https://reddit.com">reddit</a></div>'
      const links = extractMediaLinks(html)

      expect(links).toHaveLength(0)
    })

    it('should return empty array for no links', () => {
      const html = '<div>just text</div>'
      const links = extractMediaLinks(html)

      expect(links).toHaveLength(0)
    })

    it('should handle empty HTML', () => {
      const links = extractMediaLinks('')
      expect(links).toHaveLength(0)
    })
  })

  describe('stripMediaLinks', () => {
    it('should remove media links from HTML', () => {
      const html =
        '<div><p><a href="https://i.redd.it/cat.jpg">https://i.redd.it/cat.jpg</a></p><p>This is a cat!</p></div>'
      const stripped = stripMediaLinks(html)

      expect(stripped).not.toContain('i.redd.it/cat.jpg')
      expect(stripped).toContain('This is a cat!')
    })

    it('should remove paragraph if it only contains media link', () => {
      const html =
        '<div><p><a href="https://i.redd.it/cat.jpg">https://i.redd.it/cat.jpg</a></p></div>'
      const stripped = stripMediaLinks(html)

      expect(stripped).toBe('<div></div>')
    })

    it('should remove only the link if paragraph has other text', () => {
      const html =
        '<div><p>Check this out <a href="https://i.redd.it/cat.jpg">cat pic</a> cool right?</p></div>'
      const stripped = stripMediaLinks(html)

      expect(stripped).not.toContain('cat pic')
      expect(stripped).toContain('Check this out')
      expect(stripped).toContain('cool right?')
    })

    it('should preserve non-media links', () => {
      const html =
        '<div><p><a href="https://reddit.com">reddit</a></p><p><a href="https://i.redd.it/cat.jpg">cat</a></p></div>'
      const stripped = stripMediaLinks(html)

      expect(stripped).toContain('reddit')
      expect(stripped).not.toContain('i.redd.it/cat.jpg')
    })

    it('should handle multiple media links', () => {
      const html = `
        <div>
          <p><a href="https://i.redd.it/cat1.jpg">cat 1</a></p>
          <p>Text here</p>
          <p><a href="https://i.imgur.com/cat2.gif">cat 2</a></p>
        </div>
      `
      const stripped = stripMediaLinks(html)

      expect(stripped).not.toContain('cat1.jpg')
      expect(stripped).not.toContain('cat2.gif')
      expect(stripped).toContain('Text here')
    })

    it('should return unchanged HTML if no media links', () => {
      const html = '<div><p>Just text</p></div>'
      const stripped = stripMediaLinks(html)

      expect(stripped).toBe(html)
    })

    it('should handle empty HTML', () => {
      const stripped = stripMediaLinks('')
      expect(stripped).toBe('')
    })
  })
})
