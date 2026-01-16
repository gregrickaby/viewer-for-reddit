/**
 * Mock data for user saved posts endpoint (/user/{username}/saved.json)
 */
export const savedPostsMock = {
  kind: 'Listing',
  data: {
    after: 't3_saved2',
    dist: 2,
    modhash: '',
    geo_filter: '',
    children: [
      {
        kind: 't3',
        data: {
          id: 'saved1',
          title: 'First saved post',
          author: 'testauthor',
          subreddit: 'testsubreddit',
          subreddit_name_prefixed: 'r/testsubreddit',
          created_utc: 1234567890,
          score: 100,
          ups: 120,
          downs: 20,
          num_comments: 50,
          permalink: '/r/testsubreddit/comments/saved1/first_saved_post/',
          url: 'https://www.reddit.com/r/testsubreddit/comments/saved1/first_saved_post/',
          selftext: 'This is a saved post content',
          selftext_html:
            '&lt;div class="md"&gt;&lt;p&gt;This is a saved post content&lt;/p&gt;&lt;/div&gt;',
          is_self: true,
          post_hint: 'self',
          stickied: false,
          over_18: false,
          spoiler: false,
          locked: false,
          saved: true
        }
      },
      {
        kind: 't3',
        data: {
          id: 'saved2',
          title: 'Second saved post',
          author: 'anotheauthor',
          subreddit: 'programming',
          subreddit_name_prefixed: 'r/programming',
          created_utc: 1234567800,
          score: 250,
          ups: 280,
          downs: 30,
          num_comments: 75,
          permalink: '/r/programming/comments/saved2/second_saved_post/',
          url: 'https://example.com/article',
          selftext: '',
          selftext_html: null,
          is_self: false,
          post_hint: 'link',
          stickied: false,
          over_18: false,
          spoiler: false,
          locked: false,
          saved: true
        }
      }
    ],
    before: null
  }
}

/**
 * Mock data for empty saved posts response
 */
export const savedPostsEmptyMock = {
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

/**
 * Mock data with saved comments (should be filtered out to show only posts)
 */
export const savedPostsWithCommentsMock = {
  kind: 'Listing',
  data: {
    after: 't3_saved3',
    dist: 3,
    modhash: '',
    geo_filter: '',
    children: [
      {
        kind: 't3',
        data: {
          id: 'saved3',
          title: 'Saved post among comments',
          author: 'testauthor',
          subreddit: 'testsubreddit',
          subreddit_name_prefixed: 'r/testsubreddit',
          created_utc: 1234567890,
          score: 100,
          ups: 120,
          downs: 20,
          num_comments: 50,
          permalink:
            '/r/testsubreddit/comments/saved3/saved_post_among_comments/',
          url: 'https://www.reddit.com/r/testsubreddit/comments/saved3/saved_post_among_comments/',
          selftext: 'This is a saved post content',
          selftext_html:
            '&lt;div class="md"&gt;&lt;p&gt;This is a saved post content&lt;/p&gt;&lt;/div&gt;',
          is_self: true,
          post_hint: 'self',
          stickied: false,
          over_18: false,
          spoiler: false,
          locked: false,
          saved: true
        }
      },
      {
        kind: 't1', // This is a comment, should be filtered out
        data: {
          id: 'comment1',
          author: 'testauthor',
          body: 'This is a saved comment',
          created_utc: 1234567800,
          score: 50,
          ups: 55,
          downs: 5
        }
      }
    ],
    before: null
  }
}

/**
 * Mock data with stickied posts (should be filtered out)
 */
export const savedPostsWithStickiedMock = {
  kind: 'Listing',
  data: {
    after: null,
    dist: 2,
    modhash: '',
    geo_filter: '',
    children: [
      {
        kind: 't3',
        data: {
          id: 'saved4',
          title: 'Regular saved post',
          author: 'testauthor',
          subreddit: 'testsubreddit',
          subreddit_name_prefixed: 'r/testsubreddit',
          created_utc: 1234567890,
          score: 100,
          ups: 120,
          downs: 20,
          num_comments: 50,
          permalink: '/r/testsubreddit/comments/saved4/regular_saved_post/',
          url: 'https://www.reddit.com/r/testsubreddit/comments/saved4/regular_saved_post/',
          selftext: 'This is a regular saved post',
          selftext_html:
            '&lt;div class="md"&gt;&lt;p&gt;This is a regular saved post&lt;/p&gt;&lt;/div&gt;',
          is_self: true,
          post_hint: 'self',
          stickied: false,
          over_18: false,
          spoiler: false,
          locked: false,
          saved: true
        }
      },
      {
        kind: 't3',
        data: {
          id: 'saved5',
          title: 'Stickied saved post (should be filtered)',
          author: 'testauthor',
          subreddit: 'testsubreddit',
          subreddit_name_prefixed: 'r/testsubreddit',
          created_utc: 1234567800,
          score: 250,
          ups: 280,
          downs: 30,
          num_comments: 75,
          permalink: '/r/testsubreddit/comments/saved5/stickied_saved_post/',
          url: 'https://www.reddit.com/r/testsubreddit/comments/saved5/stickied_saved_post/',
          selftext: 'This is a stickied post',
          selftext_html:
            '&lt;div class="md"&gt;&lt;p&gt;This is a stickied post&lt;/p&gt;&lt;/div&gt;',
          is_self: true,
          post_hint: 'self',
          stickied: true, // Should be filtered out
          over_18: false,
          spoiler: false,
          locked: false,
          saved: true
        }
      }
    ],
    before: null
  }
}
