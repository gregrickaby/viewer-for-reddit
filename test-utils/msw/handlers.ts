import {http, HttpResponse} from 'msw'
import {aboutMock} from '../mocks/about'
import {popularMock} from '../mocks/popular'
import {searchMock} from '../mocks/search'
import {subredditMock} from '../mocks/subreddit'
import {tokenMock} from '../mocks/token'

export const handlers = [
  // Token endpoint
  http.post('https://www.reddit.com/api/v1/access_token', async () => {
    return HttpResponse.json(tokenMock)
  }),

  // About subreddit
  http.get('https://oauth.reddit.com/r/:slug/about.json', ({params}) => {
    const {slug} = params
    if (slug === 'notarealsubreddit') {
      return new HttpResponse(null, {status: 404})
    }
    return HttpResponse.json(aboutMock)
  }),

  // Popular subreddits
  http.get('https://oauth.reddit.com/subreddits/popular.json', ({request}) => {
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit')

    if (limit === '0') {
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 0,
          modhash: '',
          geo_filter: '',
          children: []
        }
      })
    }

    if (limit === '999') {
      // Return data with missing subscribers to test the ?? 0 fallback
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 4,
          modhash: '',
          geo_filter: '',
          children: [
            {
              kind: 't5',
              data: {
                display_name: 'test1',
                subscribers: 100,
                // other required fields
                public_description: 'Test subreddit 1',
                community_icon: '',
                icon_img: ''
              }
            },
            {
              kind: 't5',
              data: {
                display_name: 'test2',
                // missing subscribers field to test ?? 0 fallback for a
                public_description: 'Test subreddit 2',
                community_icon: '',
                icon_img: ''
              }
            },
            {
              kind: 't5',
              data: {
                display_name: 'test3',
                subscribers: 50,
                public_description: 'Test subreddit 3',
                community_icon: '',
                icon_img: ''
              }
            },
            {
              kind: 't5',
              data: {
                display_name: 'test4',
                // missing subscribers field to test ?? 0 fallback for b
                public_description: 'Test subreddit 4',
                community_icon: '',
                icon_img: ''
              }
            }
          ]
        }
      })
    }

    return HttpResponse.json(popularMock)
  }),

  // Subreddit search autocomplete
  http.get(
    'https://oauth.reddit.com/api/subreddit_autocomplete_v2',
    ({request}) => {
      const url = new URL(request.url)
      const query = url.searchParams.get('query')

      if (query === 'notarealsubreddit') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            dist: 0,
            modhash: '',
            geo_filter: '',
            children: []
          }
        })
      }
      return HttpResponse.json(searchMock)
    }
  ),

  // Subreddit posts
  http.get('https://oauth.reddit.com/r/:slug/:sort.json', ({params}) => {
    const {slug} = params

    if (slug === 'notarealsubreddit') {
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 0,
          modhash: '',
          geo_filter: '',
          children: []
        }
      })
    }

    if (slug === 'testfilter') {
      // Return posts with various edge cases to test filtering
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: 't3_test',
          dist: 5,
          modhash: '',
          geo_filter: '',
          children: [
            {
              kind: 't3',
              data: {
                title: 'Normal post',
                stickied: false,
                id: 'test1'
              }
            },
            {
              kind: 't3',
              data: {
                title: 'Stickied post',
                stickied: true,
                id: 'test2'
              }
            },
            {
              kind: 't3',
              data: {
                title: 'Another stickied post',
                stickied: true,
                id: 'test3'
              }
            },
            {
              kind: 't3'
              // missing data field to test child?.data check
            },
            {
              kind: 't3',
              data: null // null data to test child?.data check
            }
          ]
        }
      })
    }

    if (slug === 'testfilternull') {
      // Test case where children is null
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 0,
          modhash: '',
          geo_filter: '',
          children: null
        }
      })
    }

    if (slug === 'gaming+technology+programming') {
      // Test multi-subreddit request with + separators preserved
      return HttpResponse.json({
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
                title: 'Gaming post from multi-subreddit',
                id: 'multi1',
                stickied: false
              }
            },
            {
              kind: 't3',
              data: {
                title: 'Technology post from multi-subreddit',
                id: 'multi2',
                stickied: false
              }
            }
          ]
        }
      })
    }

    if (slug === 'test%20space+normal') {
      // Test that individual subreddit names with spaces are encoded properly
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 1,
          modhash: '',
          geo_filter: '',
          children: [
            {
              kind: 't3',
              data: {
                title: 'Post from encoded subreddit',
                id: 'encoded1',
                stickied: false
              }
            }
          ]
        }
      })
    }

    return HttpResponse.json(subredditMock)
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
    // only respond to requests ending with .json to avoid catching other routes
    const url = new URL(request.url)
    if (url.pathname.endsWith('.json')) {
      return HttpResponse.json([{}, commentsListing])
    }
    return new HttpResponse(null, {status: 404, statusText: 'Not Found'})
  }),

  // Proxy API endpoints - mirror the direct Reddit API responses
  http.get('/api/reddit', ({request}) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')

    if (!path) {
      return new HttpResponse(null, {status: 400})
    }

    // Route proxy requests to appropriate responses based on path
    if (path.includes('/about.json')) {
      const subreddit = path.split('/')[2] // Extract subreddit from /r/subreddit/about.json
      if (subreddit === 'notarealsubreddit') {
        return new HttpResponse(null, {status: 404})
      }
      return HttpResponse.json(aboutMock)
    }

    if (path.includes('/subreddits/popular.json')) {
      const pathUrl = new URL(`https://oauth.reddit.com${path}`)
      const limit = pathUrl.searchParams.get('limit')

      if (limit === '0') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            dist: 0,
            modhash: '',
            geo_filter: '',
            children: []
          }
        })
      }
      return HttpResponse.json(popularMock)
    }

    if (path.includes('/api/subreddit_autocomplete_v2')) {
      const pathUrl = new URL(`https://oauth.reddit.com${path}`)
      const query = pathUrl.searchParams.get('query')

      if (query === 'empty') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            dist: 0,
            modhash: '',
            geo_filter: '',
            children: []
          }
        })
      }
      return HttpResponse.json(searchMock)
    }

    const subredditPostsRegex = /\/r\/[^/]+\/(hot|new|top)\.json/
    if (subredditPostsRegex.exec(path)) {
      const pathUrl = new URL(`https://oauth.reddit.com${path}`)
      const after = pathUrl.searchParams.get('after')

      if (after === 'no-posts') {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            dist: 0,
            modhash: '',
            geo_filter: '',
            children: []
          }
        })
      }
      return HttpResponse.json(subredditMock)
    }

    if (path.endsWith('.json')) {
      // Comments endpoint
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
            }
          ]
        }
      }
      return HttpResponse.json([{}, commentsListing])
    }

    return new HttpResponse(null, {status: 404})
  })
]
