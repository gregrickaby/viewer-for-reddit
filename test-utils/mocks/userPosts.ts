/**
 * Mock data for user posts endpoint (/user/{username}/submitted.json)
 */
export const userPostsMock = {
  kind: 'Listing',
  data: {
    after: 't3_xyz789',
    dist: 2,
    modhash: '',
    geo_filter: '',
    children: [
      {
        kind: 't3',
        data: {
          id: 'abc123',
          title: "User's first test post",
          author: 'testuser',
          subreddit: 'testsubreddit',
          subreddit_name_prefixed: 'r/testsubreddit',
          created_utc: 1234567890,
          score: 42,
          ups: 50,
          downs: 8,
          num_comments: 15,
          permalink: '/r/testsubreddit/comments/abc123/users_first_test_post/',
          url: 'https://www.reddit.com/r/testsubreddit/comments/abc123/users_first_test_post/',
          selftext: "This is the body of the user's first post",
          selftext_html:
            '&lt;div class="md"&gt;&lt;p&gt;This is the body of the user\'s first post&lt;/p&gt;&lt;/div&gt;',
          is_self: true,
          post_hint: 'self',
          stickied: false,
          over_18: false,
          spoiler: false,
          locked: false
        }
      },
      {
        kind: 't3',
        data: {
          id: 'def456',
          title: "User's second test post with link",
          author: 'testuser',
          subreddit: 'programming',
          subreddit_name_prefixed: 'r/programming',
          created_utc: 1234567800,
          score: 128,
          ups: 150,
          downs: 22,
          num_comments: 43,
          permalink:
            '/r/programming/comments/def456/users_second_test_post_with_link/',
          url: 'https://example.com/some-article',
          selftext: '',
          selftext_html: null,
          is_self: false,
          post_hint: 'link',
          stickied: false,
          over_18: false,
          spoiler: false,
          locked: false
        }
      }
    ],
    before: null
  }
}

/**
 * Mock data for empty user posts response
 */
export const userPostsEmptyMock = {
  kind: 'Listing',
  data: {
    after: null,
    dist: 0,
    modhash: '',
    geo_filter: '',
    children: [],
    before: null
  }
}
