import {describe, expect, it} from 'vitest'
import {
  buildFeedUrlPath,
  extractSlug,
  getInitialVoteState,
  getIsVertical,
  getVoteColor
} from './reddit-helpers'

describe('reddit-helpers', () => {
  describe('getInitialVoteState', () => {
    it('returns 1 when likes is true', () => {
      expect(getInitialVoteState(true)).toBe(1)
    })

    it('returns -1 when likes is false', () => {
      expect(getInitialVoteState(false)).toBe(-1)
    })

    it('returns 0 when likes is null', () => {
      expect(getInitialVoteState(null)).toBe(0)
    })

    it('returns 0 when likes is undefined', () => {
      expect(getInitialVoteState(undefined)).toBe(0)
    })
  })

  describe('getVoteColor', () => {
    it('returns orange for upvote (1)', () => {
      expect(getVoteColor(1)).toBe('orange')
    })

    it('returns blue for downvote (-1)', () => {
      expect(getVoteColor(-1)).toBe('blue')
    })

    it('returns inherit for no vote (0)', () => {
      expect(getVoteColor(0)).toBe('inherit')
    })

    it('returns inherit for null', () => {
      expect(getVoteColor(null)).toBe('inherit')
    })
  })

  describe('extractSlug', () => {
    it('extracts slug from standard permalink', () => {
      const permalink = '/r/programming/comments/abc123/this_is_a_slug/'
      const postId = 'abc123'

      expect(extractSlug(permalink, postId)).toBe('this_is_a_slug')
    })

    it('extracts slug without trailing slash', () => {
      const permalink = '/r/javascript/comments/xyz789/my_post_title'
      const postId = 'xyz789'

      expect(extractSlug(permalink, postId)).toBe('my_post_title')
    })

    it('extracts slug with special characters', () => {
      const permalink =
        '/r/test/comments/id123/slug_with_underscores_and_numbers_42/'
      const postId = 'id123'

      expect(extractSlug(permalink, postId)).toBe(
        'slug_with_underscores_and_numbers_42'
      )
    })

    it('returns "post" when slug is not found', () => {
      const permalink = '/r/test/comments/abc123/'
      const postId = 'abc123'

      expect(extractSlug(permalink, postId)).toBe('post')
    })

    it('returns "post" when post ID is not in permalink', () => {
      const permalink = '/r/test/comments/differentid/some_slug/'
      const postId = 'abc123'

      expect(extractSlug(permalink, postId)).toBe('post')
    })

    it('handles permalink with comment reference', () => {
      const permalink = '/r/programming/comments/abc123/slug/commentid/'
      const postId = 'abc123'

      expect(extractSlug(permalink, postId)).toBe('slug')
    })

    it('handles empty permalink', () => {
      const permalink = ''
      const postId = 'abc123'

      expect(extractSlug(permalink, postId)).toBe('post')
    })

    it('handles malformed permalink', () => {
      const permalink = 'not-a-valid-permalink'
      const postId = 'abc123'

      expect(extractSlug(permalink, postId)).toBe('post')
    })

    it('handles permalink with multiple slashes', () => {
      const permalink = '/r/test/comments/abc123/slug//'
      const postId = 'abc123'

      expect(extractSlug(permalink, postId)).toBe('slug')
    })
  })

  describe('getIsVertical', () => {
    it('returns true when height is greater than width', () => {
      expect(getIsVertical(1080, 1920)).toBe(true)
    })

    it('returns false when width is greater than height', () => {
      expect(getIsVertical(1920, 1080)).toBe(false)
    })

    it('returns false when width equals height', () => {
      expect(getIsVertical(1080, 1080)).toBe(false)
    })

    it('returns false when width is undefined', () => {
      expect(getIsVertical(undefined, 1920)).toBe(false)
    })

    it('returns false when height is undefined', () => {
      expect(getIsVertical(1080, undefined)).toBe(false)
    })

    it('returns false when both are undefined', () => {
      expect(getIsVertical(undefined, undefined)).toBe(false)
    })

    it('returns false when width is 0', () => {
      expect(getIsVertical(0, 1920)).toBe(false)
    })

    it('returns false when height is 0', () => {
      expect(getIsVertical(1080, 0)).toBe(false)
    })

    it('returns false when both are 0', () => {
      expect(getIsVertical(0, 0)).toBe(false)
    })

    it('handles edge case with 1px width', () => {
      expect(getIsVertical(1, 1920)).toBe(true)
    })

    it('handles edge case with 1px height', () => {
      expect(getIsVertical(1920, 1)).toBe(false)
    })

    it('handles very large dimensions', () => {
      expect(getIsVertical(10000, 20000)).toBe(true)
      expect(getIsVertical(20000, 10000)).toBe(false)
    })
  })

  describe('buildFeedUrlPath', () => {
    const baseUrl = 'https://oauth.reddit.com'

    describe('regular subreddits', () => {
      it('builds path for regular subreddit with hot sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'popular', 'hot')).toBe(
          'https://oauth.reddit.com/r/popular/hot.json'
        )
      })

      it('builds path for regular subreddit with new sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'javascript', 'new')).toBe(
          'https://oauth.reddit.com/r/javascript/new.json'
        )
      })

      it('builds path for regular subreddit with top sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'programming', 'top')).toBe(
          'https://oauth.reddit.com/r/programming/top.json'
        )
      })

      it('builds path for regular subreddit with rising sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'askreddit', 'rising')).toBe(
          'https://oauth.reddit.com/r/askreddit/rising.json'
        )
      })

      it('builds path for regular subreddit with controversial sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'worldnews', 'controversial')).toBe(
          'https://oauth.reddit.com/r/worldnews/controversial.json'
        )
      })

      it('handles subreddit names with underscores', () => {
        expect(buildFeedUrlPath(baseUrl, 'web_design', 'hot')).toBe(
          'https://oauth.reddit.com/r/web_design/hot.json'
        )
      })

      it('handles subreddit names with numbers', () => {
        expect(buildFeedUrlPath(baseUrl, 'formula1', 'hot')).toBe(
          'https://oauth.reddit.com/r/formula1/hot.json'
        )
      })
    })

    describe('home feed', () => {
      it('builds path for empty string (home feed)', () => {
        expect(buildFeedUrlPath(baseUrl, '', 'hot')).toBe(
          'https://oauth.reddit.com/hot.json'
        )
      })

      it('builds path for "home" string', () => {
        expect(buildFeedUrlPath(baseUrl, 'home', 'hot')).toBe(
          'https://oauth.reddit.com/hot.json'
        )
      })

      it('builds path for home feed with different sorts', () => {
        expect(buildFeedUrlPath(baseUrl, 'home', 'new')).toBe(
          'https://oauth.reddit.com/new.json'
        )
        expect(buildFeedUrlPath(baseUrl, '', 'top')).toBe(
          'https://oauth.reddit.com/top.json'
        )
      })
    })

    describe('multireddits', () => {
      it('builds path for multireddit with hot sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'user/johndoe/m/tech', 'hot')).toBe(
          'https://oauth.reddit.com/user/johndoe/m/tech/hot.json'
        )
      })

      it('builds path for multireddit with new sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'user/janedoe/m/gaming', 'new')).toBe(
          'https://oauth.reddit.com/user/janedoe/m/gaming/new.json'
        )
      })

      it('builds path for multireddit with top sort', () => {
        expect(buildFeedUrlPath(baseUrl, 'user/testuser/m/news', 'top')).toBe(
          'https://oauth.reddit.com/user/testuser/m/news/top.json'
        )
      })

      it('handles multireddit with underscore in name', () => {
        expect(buildFeedUrlPath(baseUrl, 'user/test/m/my_multi', 'hot')).toBe(
          'https://oauth.reddit.com/user/test/m/my_multi/hot.json'
        )
      })

      it('handles multireddit with different username formats', () => {
        expect(
          buildFeedUrlPath(baseUrl, 'user/test_user_123/m/multi', 'hot')
        ).toBe('https://oauth.reddit.com/user/test_user_123/m/multi/hot.json')
      })
    })

    describe('edge cases', () => {
      it('handles different base URLs', () => {
        expect(
          buildFeedUrlPath('https://www.reddit.com', 'popular', 'hot')
        ).toBe('https://www.reddit.com/r/popular/hot.json')
      })

      it('handles base URL without trailing slash', () => {
        expect(
          buildFeedUrlPath('https://oauth.reddit.com', 'pics', 'new')
        ).toBe('https://oauth.reddit.com/r/pics/new.json')
      })

      it('handles single character subreddit', () => {
        expect(buildFeedUrlPath(baseUrl, 'a', 'hot')).toBe(
          'https://oauth.reddit.com/r/a/hot.json'
        )
      })
    })
  })
})
