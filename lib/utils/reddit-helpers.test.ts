import {describe, expect, it} from 'vitest'
import {
  buildFeedUrlPath,
  extractSlug,
  getInitialVoteState,
  getIsVertical,
  getVoteColor,
  isValidFullname,
  isValidMultiredditPath,
  isValidPostId,
  isValidSubredditName,
  isValidUsername
} from './reddit-helpers'

describe('reddit-helpers', () => {
  describe('isValidSubredditName', () => {
    describe('valid names', () => {
      it('accepts valid subreddit name', () => {
        expect(isValidSubredditName('popular')).toBe(true)
      })

      it('accepts name with underscores', () => {
        expect(isValidSubredditName('web_design')).toBe(true)
      })

      it('accepts name with numbers', () => {
        expect(isValidSubredditName('formula1')).toBe(true)
      })

      it('accepts minimum 3 character name', () => {
        expect(isValidSubredditName('abc')).toBe(true)
      })

      it('accepts maximum 21 character name', () => {
        expect(isValidSubredditName('a'.repeat(21))).toBe(true)
      })

      it('accepts mixed case', () => {
        expect(isValidSubredditName('AskReddit')).toBe(true)
      })

      it('accepts alphanumeric with underscores', () => {
        expect(isValidSubredditName('test_123_sub')).toBe(true)
      })
    })

    describe('invalid names - SSRF attacks', () => {
      it('rejects path traversal with ../', () => {
        expect(isValidSubredditName('../admin')).toBe(false)
      })

      it('rejects path traversal ../../', () => {
        expect(isValidSubredditName('../../internal')).toBe(false)
      })

      it('rejects names with forward slashes', () => {
        expect(isValidSubredditName('test/admin')).toBe(false)
      })

      it('rejects names with backslashes', () => {
        expect(isValidSubredditName(String.raw`test\admin`)).toBe(false)
      })

      it('rejects URL attempts', () => {
        expect(isValidSubredditName('http://evil.com')).toBe(false)
      })

      it('rejects localhost attempts', () => {
        expect(isValidSubredditName('localhost:8080')).toBe(false)
      })

      it('rejects internal IP attempts', () => {
        expect(isValidSubredditName('192.168.1.1')).toBe(false)
      })
    })

    describe('invalid names - format violations', () => {
      it('rejects too short (< 3 chars)', () => {
        expect(isValidSubredditName('ab')).toBe(false)
      })

      it('rejects too long (> 21 chars)', () => {
        expect(isValidSubredditName('a'.repeat(22))).toBe(false)
      })

      it('rejects name starting with underscore', () => {
        expect(isValidSubredditName('_test')).toBe(false)
      })

      it('rejects empty string', () => {
        expect(isValidSubredditName('')).toBe(false)
      })

      it('rejects null', () => {
        expect(isValidSubredditName(null as any)).toBe(false)
      })

      it('rejects undefined', () => {
        expect(isValidSubredditName(undefined as any)).toBe(false)
      })

      it('rejects non-string types', () => {
        expect(isValidSubredditName(123 as any)).toBe(false)
      })

      it('rejects special characters', () => {
        expect(isValidSubredditName('test-sub')).toBe(false)
        expect(isValidSubredditName('test@sub')).toBe(false)
        expect(isValidSubredditName('test.sub')).toBe(false)
        expect(isValidSubredditName('test sub')).toBe(false)
      })

      it('rejects only underscores', () => {
        expect(isValidSubredditName('___')).toBe(false)
      })
    })
  })

  describe('isValidMultiredditPath', () => {
    describe('valid paths', () => {
      it('accepts valid multireddit path', () => {
        expect(isValidMultiredditPath('user/johndoe/m/tech')).toBe(true)
      })

      it('accepts username with underscores', () => {
        expect(isValidMultiredditPath('user/john_doe/m/tech')).toBe(true)
      })

      it('accepts username with hyphens', () => {
        expect(isValidMultiredditPath('user/john-doe/m/tech')).toBe(true)
      })

      it('accepts multiname with underscores', () => {
        expect(isValidMultiredditPath('user/test/m/my_multi')).toBe(true)
      })

      it('accepts username with numbers', () => {
        expect(isValidMultiredditPath('user/test123/m/gaming')).toBe(true)
      })

      it('accepts minimum length username and multiname', () => {
        expect(isValidMultiredditPath('user/abc/m/xyz')).toBe(true)
      })

      it('accepts maximum length username (20 chars)', () => {
        expect(isValidMultiredditPath(`user/${'a'.repeat(20)}/m/multi`)).toBe(
          true
        )
      })

      it('accepts maximum length multiname (50 chars)', () => {
        expect(
          isValidMultiredditPath(`user/testuser/m/${'a'.repeat(50)}`)
        ).toBe(true)
      })
    })

    describe('invalid paths - SSRF attacks', () => {
      it('rejects path traversal with ../', () => {
        expect(isValidMultiredditPath('user/../admin/m/test')).toBe(false)
      })

      it('rejects path traversal ../../', () => {
        expect(isValidMultiredditPath('user/../../internal/m/test')).toBe(false)
      })

      it('rejects backslash path traversal', () => {
        expect(isValidMultiredditPath(String.raw`user\admin\m\test`)).toBe(
          false
        )
      })

      it('rejects URL injection attempts', () => {
        expect(isValidMultiredditPath('user/http://evil.com/m/test')).toBe(
          false
        )
      })

      it('rejects extra path segments', () => {
        expect(isValidMultiredditPath('user/test/m/multi/extra/segment')).toBe(
          false
        )
      })
    })

    describe('invalid paths - format violations', () => {
      it('rejects missing "user" prefix', () => {
        expect(isValidMultiredditPath('test/johndoe/m/tech')).toBe(false)
      })

      it('rejects missing "m" segment', () => {
        expect(isValidMultiredditPath('user/johndoe/multi/tech')).toBe(false)
      })

      it('rejects too few segments', () => {
        expect(isValidMultiredditPath('user/johndoe/m')).toBe(false)
      })

      it('rejects username too short (< 3 chars)', () => {
        expect(isValidMultiredditPath('user/ab/m/tech')).toBe(false)
      })

      it('rejects username too long (> 20 chars)', () => {
        expect(
          isValidMultiredditPath('user/abcdefghijklmnopqrstuvwxyz/m/tech')
        ).toBe(false)
      })

      it('rejects multiname too short (< 3 chars)', () => {
        expect(isValidMultiredditPath('user/test/m/ab')).toBe(false)
      })

      it('rejects multiname too long (> 50 chars)', () => {
        expect(isValidMultiredditPath(`user/test/m/${'a'.repeat(51)}`)).toBe(
          false
        )
      })

      it('rejects empty string', () => {
        expect(isValidMultiredditPath('')).toBe(false)
      })

      it('rejects null', () => {
        expect(isValidMultiredditPath(null as any)).toBe(false)
      })

      it('rejects undefined', () => {
        expect(isValidMultiredditPath(undefined as any)).toBe(false)
      })

      it('rejects non-string types', () => {
        expect(isValidMultiredditPath(123 as any)).toBe(false)
      })

      it('rejects special characters in username', () => {
        expect(isValidMultiredditPath('user/test@user/m/tech')).toBe(false)
      })

      it('rejects special characters in multiname', () => {
        expect(isValidMultiredditPath('user/test/m/tech-multi')).toBe(false)
      })
    })
  })

  describe('isValidUsername', () => {
    describe('valid usernames', () => {
      it('accepts valid username', () => {
        expect(isValidUsername('johndoe')).toBe(true)
      })

      it('accepts username with underscores', () => {
        expect(isValidUsername('john_doe')).toBe(true)
      })

      it('accepts username with hyphens', () => {
        expect(isValidUsername('john-doe')).toBe(true)
      })

      it('accepts username with numbers', () => {
        expect(isValidUsername('user123')).toBe(true)
      })

      it('accepts minimum 3 character username', () => {
        expect(isValidUsername('abc')).toBe(true)
      })

      it('accepts maximum 20 character username', () => {
        expect(isValidUsername('a'.repeat(20))).toBe(true)
      })

      it('accepts mixed case', () => {
        expect(isValidUsername('JohnDoe')).toBe(true)
      })
    })

    describe('invalid usernames - SSRF attacks', () => {
      it('rejects path traversal with ../', () => {
        expect(isValidUsername('../admin')).toBe(false)
      })

      it('rejects names with forward slashes', () => {
        expect(isValidUsername('test/admin')).toBe(false)
      })

      it('rejects names with backslashes', () => {
        expect(isValidUsername(String.raw`test\admin`)).toBe(false)
      })

      it('rejects URL attempts', () => {
        expect(isValidUsername('http://evil.com')).toBe(false)
      })
    })

    describe('invalid usernames - format violations', () => {
      it('rejects too short (< 3 chars)', () => {
        expect(isValidUsername('ab')).toBe(false)
      })

      it('rejects too long (> 20 chars)', () => {
        expect(isValidUsername('a'.repeat(21))).toBe(false)
      })

      it('rejects empty string', () => {
        expect(isValidUsername('')).toBe(false)
      })

      it('rejects null', () => {
        expect(isValidUsername(null as any)).toBe(false)
      })

      it('rejects undefined', () => {
        expect(isValidUsername(undefined as any)).toBe(false)
      })

      it('rejects non-string types', () => {
        expect(isValidUsername(123 as any)).toBe(false)
      })

      it('rejects special characters', () => {
        expect(isValidUsername('test@user')).toBe(false)
        expect(isValidUsername('test.user')).toBe(false)
        expect(isValidUsername('test user')).toBe(false)
      })
    })
  })

  describe('isValidPostId', () => {
    describe('valid post IDs', () => {
      it('accepts valid post ID', () => {
        expect(isValidPostId('abc123')).toBe(true)
      })

      it('accepts base36 lowercase', () => {
        expect(isValidPostId('xyz789')).toBe(true)
      })

      it('accepts minimum 4 character ID', () => {
        expect(isValidPostId('abcd')).toBe(true)
      })

      it('accepts maximum 12 character ID', () => {
        expect(isValidPostId('a'.repeat(12))).toBe(true)
      })

      it('accepts numbers only', () => {
        expect(isValidPostId('123456')).toBe(true)
      })

      it('accepts letters only', () => {
        expect(isValidPostId('abcdef')).toBe(true)
      })
    })

    describe('invalid post IDs - SSRF attacks', () => {
      it('rejects path traversal with ../', () => {
        expect(isValidPostId('../admin')).toBe(false)
      })

      it('rejects IDs with forward slashes', () => {
        expect(isValidPostId('test/123')).toBe(false)
      })

      it('rejects IDs with backslashes', () => {
        expect(isValidPostId(String.raw`test\123`)).toBe(false)
      })
    })

    describe('invalid post IDs - format violations', () => {
      it('rejects too short (< 4 chars)', () => {
        expect(isValidPostId('abc')).toBe(false)
      })

      it('rejects too long (> 12 chars)', () => {
        expect(isValidPostId('a'.repeat(13))).toBe(false)
      })

      it('rejects uppercase letters', () => {
        expect(isValidPostId('ABC123')).toBe(false)
      })

      it('rejects empty string', () => {
        expect(isValidPostId('')).toBe(false)
      })

      it('rejects null', () => {
        expect(isValidPostId(null as any)).toBe(false)
      })

      it('rejects undefined', () => {
        expect(isValidPostId(undefined as any)).toBe(false)
      })

      it('rejects non-string types', () => {
        expect(isValidPostId(123 as any)).toBe(false)
      })

      it('rejects special characters', () => {
        expect(isValidPostId('test-123')).toBe(false)
        expect(isValidPostId('test_123')).toBe(false)
      })
    })
  })

  describe('isValidFullname', () => {
    describe('valid fullnames', () => {
      it('accepts valid post fullname (t3)', () => {
        expect(isValidFullname('t3_abc123')).toBe(true)
      })

      it('accepts valid comment fullname (t1)', () => {
        expect(isValidFullname('t1_xyz789')).toBe(true)
      })

      it('accepts all valid type prefixes (t1-t6)', () => {
        expect(isValidFullname('t1_abc123')).toBe(true) // comment
        expect(isValidFullname('t2_abc123')).toBe(true) // account
        expect(isValidFullname('t3_abc123')).toBe(true) // link/post
        expect(isValidFullname('t4_abc123')).toBe(true) // message
        expect(isValidFullname('t5_abc123')).toBe(true) // subreddit
        expect(isValidFullname('t6_abc123')).toBe(true) // award
      })

      it('accepts minimum ID length', () => {
        expect(isValidFullname('t3_abcd')).toBe(true)
      })

      it('accepts maximum ID length', () => {
        expect(isValidFullname(`t3_${'a'.repeat(12)}`)).toBe(true)
      })
    })

    describe('invalid fullnames - SSRF attacks', () => {
      it('rejects path traversal attempts', () => {
        expect(isValidFullname('t3_../admin')).toBe(false)
        expect(isValidFullname('../t3_abc123')).toBe(false)
      })

      it('rejects fullnames with forward slashes', () => {
        expect(isValidFullname('t3_test/123')).toBe(false)
      })

      it('rejects fullnames with backslashes', () => {
        expect(isValidFullname(String.raw`t3_test\123`)).toBe(false)
      })
    })

    describe('invalid fullnames - format violations', () => {
      it('rejects invalid type prefix (t0)', () => {
        expect(isValidFullname('t0_abc123')).toBe(false)
      })

      it('rejects invalid type prefix (t7)', () => {
        expect(isValidFullname('t7_abc123')).toBe(false)
      })

      it('rejects missing underscore separator', () => {
        expect(isValidFullname('t3abc123')).toBe(false)
      })

      it('rejects ID too short', () => {
        expect(isValidFullname('t3_abc')).toBe(false)
      })

      it('rejects ID too long', () => {
        expect(isValidFullname(`t3_${'a'.repeat(13)}`)).toBe(false)
      })

      it('rejects uppercase letters in ID', () => {
        expect(isValidFullname('t3_ABC123')).toBe(false)
      })

      it('rejects empty string', () => {
        expect(isValidFullname('')).toBe(false)
      })

      it('rejects null', () => {
        expect(isValidFullname(null as any)).toBe(false)
      })

      it('rejects undefined', () => {
        expect(isValidFullname(undefined as any)).toBe(false)
      })

      it('rejects non-string types', () => {
        expect(isValidFullname(123 as any)).toBe(false)
      })

      it('rejects missing type prefix', () => {
        expect(isValidFullname('_abc123')).toBe(false)
        expect(isValidFullname('abc123')).toBe(false)
      })

      it('rejects special characters in ID', () => {
        expect(isValidFullname('t3_test-123')).toBe(false)
        expect(isValidFullname('t3_test@123')).toBe(false)
      })
    })
  })

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
      expect(getIsVertical(1080)).toBe(false)
    })

    it('returns false when both are undefined', () => {
      expect(getIsVertical()).toBe(false)
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
    })

    // Security - SSRF prevention tests
    it.each([
      [
        'a',
        'Invalid subreddit name',
        'single character subreddit (< 3 chars minimum)'
      ],
      ['../admin', 'Invalid subreddit name', 'path traversal attempt'],
      [
        '../../internal',
        'Invalid subreddit name',
        'path traversal with multiple levels'
      ],
      ['test/admin', 'Invalid subreddit name', 'forward slash in subreddit'],
      [
        String.raw`test\admin`,
        'Invalid subreddit name',
        'backslash in subreddit'
      ],
      ['http://evil.com', 'Invalid subreddit name', 'URL injection attempt'],
      ['localhost:8080', 'Invalid subreddit name', 'localhost attempt'],
      ['192.168.1.1', 'Invalid subreddit name', 'IP address attempt'],
      [
        'user/../admin/m/test',
        'Invalid multireddit path format',
        'invalid multireddit path'
      ],
      [
        'user/test/m/multi/extra',
        'Invalid multireddit path format',
        'multireddit with extra segments'
      ],
      ['ab', 'Invalid subreddit name', 'subreddit name too short'],
      ['a'.repeat(22), 'Invalid subreddit name', 'subreddit name too long'],
      ['_test', 'Invalid subreddit name', 'subreddit starting with underscore'],
      ['test-sub', 'Invalid subreddit name', 'special characters (hyphen)'],
      ['test@sub', 'Invalid subreddit name', 'special characters (at sign)'],
      ['test.sub', 'Invalid subreddit name', 'special characters (period)']
    ])('throws error on %s (%s)', (input, expectedError, _description) => {
      expect(() => buildFeedUrlPath(baseUrl, input, 'hot')).toThrow(
        expectedError
      )
    })
  })
})
