import {http, HttpResponse} from 'msw'
import {aboutMock} from '../../mocks/about'
import {popularMock} from '../../mocks/popular'
import {searchMock} from '../../mocks/search'
import {subredditMock} from '../../mocks/subreddit'
import {userCommentsEmptyMock, userCommentsMock} from '../../mocks/userComments'
import {userPostsEmptyMock, userPostsMock} from '../../mocks/userPosts'
import {userNotFoundMock, userProfileMock} from '../../mocks/userProfile'

export const proxyHandlers = [
  // Local API endpoint - proxy to Reddit API (handle both localhost and relative URLs)
  http.get('*/api/reddit', async ({request}) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')
    console.error('DEBUG: Proxy handler called with path:', path)

    if (!path) {
      return new HttpResponse(null, {status: 400})
    }

    // User profile
    const userProfileRegex = /^\/user\/(.+)\/about\.json$/
    const profileMatch = userProfileRegex.exec(path)
    if (profileMatch) {
      const username = profileMatch[1]

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }
      return HttpResponse.json(userProfileMock)
    }

    // User posts
    const userPostsRegex = /^\/user\/(.+)\/submitted\.json/
    const postsMatch = userPostsRegex.exec(path)
    if (postsMatch) {
      const username = postsMatch[1]
      const after = new URL(`http://example.com${path}`).searchParams.get(
        'after'
      )

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }

      if (username === 'emptyuser' || after === 'no-more-posts') {
        return HttpResponse.json(userPostsEmptyMock)
      }

      return HttpResponse.json(userPostsMock)
    }

    // User comments
    const userCommentsRegex = /^\/user\/(.+)\/comments\.json/
    const commentsMatch = userCommentsRegex.exec(path)
    if (commentsMatch) {
      const username = commentsMatch[1]
      const after = new URL(`http://example.com${path}`).searchParams.get(
        'after'
      )

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }

      if (username === 'emptyuser' || after === 'no-more-comments') {
        return HttpResponse.json(userCommentsEmptyMock)
      }

      return HttpResponse.json(userCommentsMock)
    }

    // Post comments
    const postCommentsRegex = /^\/r\/.+\/comments\/[^/]+(?:\/[^/]*)?\.json$/
    console.error(
      'DEBUG: Checking path for post comments:',
      path,
      'matches:',
      postCommentsRegex.test(path)
    )
    if (postCommentsRegex.test(path)) {
      console.error('DEBUG: Returning post comments mock')
      const {postCommentsMock} = await import('../../mocks/postComments')
      return HttpResponse.json(postCommentsMock)
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
                  public_description: 'Test subreddit 1',
                  community_icon: '',
                  icon_img: ''
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: 'test2',
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
    }

    if (path.includes('/api/subreddit_autocomplete_v2')) {
      const pathUrl = new URL(`https://oauth.reddit.com${path}`)
      const query = pathUrl.searchParams.get('query')

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

    const subredditPostsRegex = /\/r\/[^/]+\/(hot|new|top)\.json/
    if (subredditPostsRegex.exec(path)) {
      const pathUrl = new URL(`https://oauth.reddit.com${path}`)
      const after = pathUrl.searchParams.get('after')

      if (path.includes('notarealsubreddit')) {
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

      if (after === 'no-more-posts') {
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

    // Fallback for unknown paths
    return new HttpResponse(null, {status: 404})
  }),

  // Comments endpoint for subreddit posts permalink
  http.get('/api/reddit', async ({request}) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')

    if (!path) {
      return new HttpResponse(null, {status: 400})
    }

    // User profile
    const userProfileRegex = /^\/user\/(.+)\/about\.json$/
    const profileMatch = userProfileRegex.exec(path)
    if (profileMatch) {
      const username = profileMatch[1]

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }
      return HttpResponse.json(userProfileMock)
    }

    // User posts
    const userPostsRegex = /^\/user\/(.+)\/submitted\.json/
    const postsMatch = userPostsRegex.exec(path)
    if (postsMatch) {
      const username = postsMatch[1]
      const after = new URL(`http://example.com${path}`).searchParams.get(
        'after'
      )

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }

      if (username === 'emptyuser' || after === 'no-more-posts') {
        return HttpResponse.json(userPostsEmptyMock)
      }

      return HttpResponse.json(userPostsMock)
    }

    // User comments
    const userCommentsRegex = /^\/user\/(.+)\/comments\.json/
    const commentsMatch = userCommentsRegex.exec(path)
    if (commentsMatch) {
      const username = commentsMatch[1]
      const after = new URL(`http://example.com${path}`).searchParams.get(
        'after'
      )

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }

      if (username === 'emptyuser' || after === 'no-more-comments') {
        return HttpResponse.json(userCommentsEmptyMock)
      }

      return HttpResponse.json(userCommentsMock)
    }

    // Post comments
    const postCommentsRegex = /^\/r\/.+\/comments\/[^/]+(?:\/[^/]*)?\.json$/
    if (postCommentsRegex.test(path)) {
      const {postCommentsMock} = await import('../../mocks/postComments')
      return HttpResponse.json(postCommentsMock)
    }

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
                  public_description: 'Test subreddit 1',
                  community_icon: '',
                  icon_img: ''
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: 'test2',
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
    }

    if (path.includes('/api/subreddit_autocomplete_v2')) {
      const pathUrl = new URL(`https://oauth.reddit.com${path}`)
      const query = pathUrl.searchParams.get('query')

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

    const subredditPostsRegex = /\/r\/[^/]+\/(hot|new|top)\.json/
    if (subredditPostsRegex.exec(path)) {
      const pathUrl = new URL(`https://oauth.reddit.com${path}`)
      const after = pathUrl.searchParams.get('after')

      if (path.includes('notarealsubreddit')) {
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

      if (after === 'no-more-posts') {
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

    const commentsRegex = /^\/r\/[^/]+\/comments\/[^/]+/
    if (commentsRegex.exec(path)) {
      // Create mock comments response
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
                id: 'comment1',
                author: 'testuser',
                body: 'First comment',
                body_html:
                  '&lt;div class="md"&gt;&lt;p&gt;First comment&lt;/p&gt;&lt;/div&gt;'
              }
            },
            {
              kind: 't1',
              data: {
                id: 'comment2',
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
