import {http, HttpResponse} from 'msw'
import {singlePostMock} from '../../mocks/singlePost'

export const commentHandlers = [
  // Comments for a post (permalink.json) — allow multi-segment permalinks
  http.get('https://oauth.reddit.com/:permalink*', ({request}) => {
    // Build a minimal comments listing (index 1 contains comments)
    const commentsListing = {
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

    // reddit comments endpoint returns an array: [post, comments]
    // only respond to requests ending with .json and containing /comments/
    const url = new URL(request.url)
    if (url.pathname.endsWith('.json') && url.pathname.includes('/comments/')) {
      return HttpResponse.json([singlePostMock[0], commentsListing])
    }
    return new HttpResponse(null, {status: 404, statusText: 'Not Found'})
  })
]
