/**
 * Mock data for user comments endpoint (/user/{username}/comments.json)
 */
export const userCommentsMock = {
  kind: 'Listing',
  data: {
    after: 't1_xyz789',
    dist: 2,
    modhash: '',
    geo_filter: '',
    children: [
      {
        kind: 't1',
        data: {
          id: 'comment1',
          author: 'testuser',
          body: 'This is a test comment from the user',
          body_html:
            '&lt;div class="md"&gt;&lt;p&gt;This is a test comment from the user&lt;/p&gt;&lt;/div&gt;',
          created_utc: 1234567890,
          score: 15,
          ups: 18,
          downs: 3,
          subreddit: 'testsubreddit',
          subreddit_name_prefixed: 'r/testsubreddit',
          link_id: 't3_abc123',
          link_title: 'Some post title',
          link_permalink: '/r/testsubreddit/comments/abc123/some_post_title/',
          parent_id: 't3_abc123',
          depth: 0,
          is_submitter: false,
          stickied: false,
          score_hidden: false
        }
      },
      {
        kind: 't1',
        data: {
          id: 'comment2',
          author: 'testuser',
          body: 'This is another comment from the user with **markdown**',
          body_html:
            '&lt;div class="md"&gt;&lt;p&gt;This is another comment from the user with &lt;strong&gt;markdown&lt;/strong&gt;&lt;/p&gt;&lt;/div&gt;',
          created_utc: 1234567800,
          score: 32,
          ups: 35,
          downs: 3,
          subreddit: 'programming',
          subreddit_name_prefixed: 'r/programming',
          link_id: 't3_def456',
          link_title: 'Programming discussion',
          link_permalink:
            '/r/programming/comments/def456/programming_discussion/',
          parent_id: 't1_xyz123',
          depth: 1,
          is_submitter: true,
          stickied: false,
          score_hidden: false
        }
      }
    ],
    before: null
  }
}

/**
 * Mock data for empty user comments response
 */
export const userCommentsEmptyMock = {
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
