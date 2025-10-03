import {parsePostLink} from './parsePostLink'

describe('parsePostLink', () => {
  describe('Internal routing', () => {
    it('should preserve full permalink with title for SEO', () => {
      const permalink = '/r/programming/comments/abc123/my_awesome_post/'
      const result = parsePostLink(permalink, true)

      expect(result).toBe('/r/programming/comments/abc123/my_awesome_post/')
    })

    it('should handle permalinks without trailing slash', () => {
      const permalink = '/r/javascript/comments/xyz789/cool_library'
      const result = parsePostLink(permalink, true)

      expect(result).toBe('/r/javascript/comments/xyz789/cool_library')
    })

    it('should handle permalinks with complex subreddit names', () => {
      const permalink = '/r/webdev-discussions/comments/def456/title_here/'
      const result = parsePostLink(permalink, true)

      expect(result).toBe('/r/webdev-discussions/comments/def456/title_here/')
    })

    it('should handle permalinks with special characters in title', () => {
      const permalink =
        '/r/programming/comments/ghi789/title_with_special_chars/'
      const result = parsePostLink(permalink, true)

      expect(result).toBe(
        '/r/programming/comments/ghi789/title_with_special_chars/'
      )
    })

    it('should handle permalinks without title (backward compatibility)', () => {
      const permalink = '/r/programming/comments/abc123/'
      const result = parsePostLink(permalink, true)

      expect(result).toBe('/r/programming/comments/abc123/')
    })

    it('should return # for undefined permalink', () => {
      const result = parsePostLink(undefined, true)

      expect(result).toBe('#')
    })

    it('should return # for empty permalink', () => {
      const result = parsePostLink('', true)

      expect(result).toBe('#')
    })
  })

  describe('External routing', () => {
    it('should return external Reddit link when internal routing is disabled', () => {
      const permalink = '/r/programming/comments/abc123/my-post/'
      const result = parsePostLink(permalink, false)

      expect(result).toBe(
        'https://reddit.com/r/programming/comments/abc123/my-post/'
      )
    })

    it('should handle undefined permalink with external routing', () => {
      const result = parsePostLink(undefined, false)

      expect(result).toBe('https://reddit.comundefined')
    })

    it('should handle empty permalink with external routing', () => {
      const result = parsePostLink('', false)

      expect(result).toBe('https://reddit.com')
    })
  })

  describe('Edge cases', () => {
    it('should handle very short post IDs with title', () => {
      const permalink = '/r/test/comments/a/title/'
      const result = parsePostLink(permalink, true)

      expect(result).toBe('/r/test/comments/a/title/')
    })

    it('should handle very long post IDs with title', () => {
      const permalink =
        '/r/test/comments/verylongpostidentifier123456789/title/'
      const result = parsePostLink(permalink, true)

      expect(result).toBe(
        '/r/test/comments/verylongpostidentifier123456789/title/'
      )
    })

    it('should handle subreddits with numbers and underscores', () => {
      const permalink = '/r/programming_2024/comments/abc123/title/'
      const result = parsePostLink(permalink, true)

      expect(result).toBe('/r/programming_2024/comments/abc123/title/')
    })
  })
})
