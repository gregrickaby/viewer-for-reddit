import {http, HttpResponse} from 'msw'
import {singlePostMock} from '../../mocks/singlePost'

export const commentHandlers = [
  // POST /api/reddit/comment - Next.js API proxy (success case)
  http.post('http://localhost:3000/api/reddit/comment', async ({request}) => {
    const body = await request.json()
    const {thing_id, text} = body as {thing_id: string; text: string}

    return HttpResponse.json({
      kind: 't1',
      data: {
        id: 'new_comment_id',
        name: 't1_new_comment_id',
        author: 'testuser',
        body: text,
        body_html: `<div class="md"><p>${text}</p></div>`,
        parent_id: thing_id,
        created_utc: Date.now() / 1000,
        ups: 1
      }
    })
  }),

  // POST /api/reddit/comment/delete - Next.js API proxy (success case)
  // Matches both /api/reddit/comment/delete and /api/reddit/comment/delete?path=...
  http.post(
    'http://localhost:3000/api/reddit/comment/delete',
    async ({request}) => {
      const body = await request.json()
      const {id} = body as {id: string}

      const commentIdPattern = /^t1_[a-z0-9]+$/i
      // Validate comment ID format
      if (!id || !commentIdPattern.test(id)) {
        return HttpResponse.json({error: 'Invalid comment ID'}, {status: 400})
      }

      return HttpResponse.json({success: true})
    }
  ),

  // POST /api/del - Reddit OAuth endpoint (success case)
  http.post('https://oauth.reddit.com/api/del', async ({request}) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const id = params.get('id')

    const commentIdPattern = /^t1_[a-z0-9]+$/i
    // Validate comment ID format
    if (!id || !commentIdPattern.test(id)) {
      return new HttpResponse(null, {status: 400})
    }

    // Reddit returns empty body on successful deletion
    return new HttpResponse(null, {status: 200})
  }),

  // POST /api/comment - Reddit OAuth endpoint (success case)
  http.post('https://oauth.reddit.com/api/comment', async ({request}) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const thing_id = params.get('thing_id')
    const text = params.get('text')

    return HttpResponse.json({
      json: {
        errors: [],
        data: {
          things: [
            {
              kind: 't1',
              data: {
                id: 'new_comment_id',
                name: 't1_new_comment_id',
                author: 'testuser',
                body: text,
                body_html: `&lt;div class="md"&gt;&lt;p&gt;${text}&lt;/p&gt;&lt;/div&gt;`,
                parent_id: thing_id,
                created_utc: Date.now() / 1000
              }
            }
          ]
        }
      }
    })
  }),

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
