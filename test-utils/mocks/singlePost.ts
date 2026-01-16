/**
 * Mock data for a single Reddit post with comments response.
 * Mirrors the structure returned by Reddit's /r/subreddit/comments/postId.json endpoint.
 * Returns an array with [postListing, commentsListing] as per Reddit API format.
 */
export const singlePostMock: any[] = [
  // Post listing (first element)
  {
    kind: 'Listing',
    data: {
      after: null,
      dist: 1,
      modhash: '',
      geo_filter: null,
      children: [
        {
          kind: 't3',
          data: {
            id: 'abc123',
            subreddit: 'programming',
            subreddit_name_prefixed: 'r/programming',
            title:
              'Amazing new JavaScript framework that will change everything',
            author: 'testuser',
            created_utc: 1677695999,
            ups: 1337,
            num_comments: 42,
            permalink:
              '/r/programming/comments/abc123/amazing_new_javascript_framework/',
            url: 'https://example.com/article',
            selftext:
              'This is the post content with some **markdown** formatting.',
            selftext_html:
              '&lt;div class="md"&gt;&lt;p&gt;This is the post content with some &lt;strong&gt;markdown&lt;/strong&gt; formatting.&lt;/p&gt;&lt;/div&gt;',
            thumbnail: '',
            thumbnail_height: null,
            thumbnail_width: null,
            is_self: true,
            is_video: false,
            stickied: false,
            locked: false,
            archived: false,
            over_18: false,
            spoiler: false,
            hidden: false,
            saved: false,
            clicked: false,
            visited: false,
            score: 1337,
            upvote_ratio: 0.95,
            quarantine: false,
            gilded: 0,
            distinguished: null,
            media: null,
            secure_media: null,
            media_embed: {},
            secure_media_embed: {},
            post_hint: undefined,
            preview: undefined
          }
        }
      ]
    }
  },
  // Comments listing (second element)
  {
    kind: 'Listing',
    data: {
      after: null,
      dist: 3,
      modhash: '',
      geo_filter: null,
      children: [
        {
          kind: 't1',
          data: {
            id: 'comment1',
            author: 'commentuser1',
            body: 'Great post! This framework looks really promising.',
            body_html:
              '&lt;div class="md"&gt;&lt;p&gt;Great post! This framework looks really promising.&lt;/p&gt;&lt;/div&gt;',
            created_utc: 1677696100,
            score: 25,
            ups: 25,
            downs: 0,
            permalink:
              '/r/programming/comments/abc123/amazing_new_javascript_framework/comment1/',
            parent_id: 't3_abc123',
            depth: 0,
            replies: '',
            distinguished: null,
            stickied: false,
            is_submitter: false,
            collapsed: false,
            score_hidden: false,
            archived: false,
            locked: false,
            gilded: 0,
            saved: false,
            controversiality: 0
          }
        },
        {
          kind: 't1',
          data: {
            id: 'comment2',
            author: 'commentuser2',
            body: 'Not another JavaScript framework... 😩',
            body_html:
              '&lt;div class="md"&gt;&lt;p&gt;Not another JavaScript framework... 😩&lt;/p&gt;&lt;/div&gt;',
            created_utc: 1677696200,
            score: 15,
            ups: 18,
            downs: 3,
            permalink:
              '/r/programming/comments/abc123/amazing_new_javascript_framework/comment2/',
            parent_id: 't3_abc123',
            depth: 0,
            replies: '',
            distinguished: null,
            stickied: false,
            is_submitter: false,
            collapsed: false,
            score_hidden: false,
            archived: false,
            locked: false,
            gilded: 0,
            saved: false,
            controversiality: 1
          }
        },
        {
          kind: 't1',
          data: {
            id: 'comment3',
            author: 'AutoModerator',
            body: 'This is an AutoModerator comment that should be filtered out.',
            body_html:
              '&lt;div class="md"&gt;&lt;p&gt;This is an AutoModerator comment that should be filtered out.&lt;/p&gt;&lt;/div&gt;',
            created_utc: 1677696050,
            score: 1,
            ups: 1,
            downs: 0,
            permalink:
              '/r/programming/comments/abc123/amazing_new_javascript_framework/comment3/',
            parent_id: 't3_abc123',
            depth: 0,
            replies: '',
            distinguished: 'moderator',
            stickied: true,
            is_submitter: false,
            collapsed: false,
            score_hidden: false,
            archived: false,
            locked: false,
            gilded: 0,
            saved: false,
            controversiality: 0
          }
        }
      ]
    }
  }
]

/**
 * Mock data for a single post that doesn't exist (404 case)
 */
export const singlePostNotFoundMock = {
  error: 404,
  message: 'Not Found'
}

/**
 * Mock data for a single post with no comments
 */
export const singlePostNoCommentsMock: any[] = [
  // Post listing with different ID
  {
    kind: 'Listing',
    data: {
      after: null,
      dist: 1,
      modhash: '',
      geo_filter: null,
      children: [
        {
          kind: 't3',
          data: (() => {
            const baseData = singlePostMock[0]?.data?.children?.[0]?.data
            return {
              ...baseData,
              id: 'nocomments',
              name: 't3_nocomments'
            }
          })()
        }
      ]
    }
  },
  // Empty comments listing
  {
    kind: 'Listing',
    data: {
      after: null,
      dist: 0,
      modhash: '',
      geo_filter: null,
      children: []
    }
  }
]
