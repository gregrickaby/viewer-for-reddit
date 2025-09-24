/**
 * Mock data for Reddit post comments
 */
export const postCommentsMock = [
  {}, // First element is always the post data (we can ignore it for comments)
  {
    kind: 'Listing',
    data: {
      after: null,
      dist: 2,
      modhash: '',
      geo_filter: '',
      children: [
        {
          kind: 't1',
          data: {
            id: 'c1',
            author: 'testuser',
            body: 'First comment',
            body_html:
              '&lt;div class="md"&gt;&lt;p&gt;First comment&lt;/p&gt;&lt;/div&gt;'
          }
        },
        {
          kind: 't1',
          data: {
            id: 'c2',
            author: 'anotheruser',
            body: 'Second comment with a link',
            body_html:
              '&lt;div class="md"&gt;&lt;p&gt;Second comment with a &lt;a href="https://example.com"&gt;link&lt;/a&gt;&lt;/p&gt;&lt;/div&gt;'
          }
        },
        {
          kind: 't1',
          data: {
            id: 'c3',
            author: 'AutoModerator',
            body: 'This is an AutoModerator comment',
            body_html:
              '&lt;div class="md"&gt;&lt;p&gt;This is an AutoModerator comment&lt;/p&gt;&lt;/div&gt;'
          }
        }
      ]
    }
  }
]

export const emptyPostCommentsMock = [
  {}, // Post data
  {
    kind: 'Listing',
    data: {
      after: null,
      dist: 0,
      modhash: '',
      geo_filter: '',
      children: []
    }
  }
]
