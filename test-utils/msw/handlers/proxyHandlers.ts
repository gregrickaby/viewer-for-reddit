import {http, HttpResponse} from 'msw'
import {aboutMock} from '../../mocks/about'
import {popularMock} from '../../mocks/popular'
import {searchMock} from '../../mocks/search'
import {subredditMock} from '../../mocks/subreddit'
import {userCommentsEmptyMock, userCommentsMock} from '../../mocks/userComments'
import {userPostsEmptyMock, userPostsMock} from '../../mocks/userPosts'
import {userNotFoundMock, userProfileMock} from '../../mocks/userProfile'

/**
 * Handle user profile requests
 */
function handleUserProfile(path: string): Response | null {
  const userProfileRegex = /^\/user\/(.+)\/about\.json$/
  const profileMatch = userProfileRegex.exec(path)
  if (profileMatch) {
    const username = profileMatch[1]

    if (username === 'nonexistentuser') {
      return HttpResponse.json(userNotFoundMock, {status: 404})
    }
    return HttpResponse.json(userProfileMock)
  }
  return null
}

/**
 * Handle user posts requests
 */
function handleUserPosts(path: string): Response | null {
  const userPostsRegex = /^\/user\/(.+)\/submitted\.json/
  const postsMatch = userPostsRegex.exec(path)
  if (postsMatch) {
    const username = postsMatch[1]
    const after = new URL(`http://example.com${path}`).searchParams.get('after')

    if (username === 'nonexistentuser') {
      return HttpResponse.json(userNotFoundMock, {status: 404})
    }

    if (username === 'emptyuser' || after === 'no-more-posts') {
      return HttpResponse.json(userPostsEmptyMock)
    }

    return HttpResponse.json(userPostsMock)
  }
  return null
}

/**
 * Handle user comments requests
 */
function handleUserComments(path: string): Response | null {
  const userCommentsRegex = /^\/user\/(.+)\/comments\.json/
  const commentsMatch = userCommentsRegex.exec(path)
  if (commentsMatch) {
    const username = commentsMatch[1]
    const after = new URL(`http://example.com${path}`).searchParams.get('after')

    if (username === 'nonexistentuser') {
      return HttpResponse.json(userNotFoundMock, {status: 404})
    }

    if (username === 'emptyuser' || after === 'no-more-comments') {
      return HttpResponse.json(userCommentsEmptyMock)
    }

    return HttpResponse.json(userCommentsMock)
  }
  return null
}

/**
 * Handle post comments requests
 */
async function handlePostComments(path: string): Promise<Response | null> {
  // Post comments (from subreddit permalink with .json)
  const postCommentsRegex = /^\/r\/(.+)\/comments\/([^/]+)(?:\/[^/]*)?\.json$/
  const pathWithoutQuery = path.split('?')[0]
  const match = postCommentsRegex.exec(pathWithoutQuery)

  if (match) {
    const [, subreddit, postId] = match

    // Handle test cases for single post endpoint
    if (subreddit === 'notfound' || postId === 'notfound') {
      return new HttpResponse(null, {status: 404})
    }

    if (subreddit === 'private') {
      return new HttpResponse(null, {status: 403})
    }

    if (subreddit === 'error') {
      return new HttpResponse(null, {status: 500})
    }

    if (postId === 'nocomments') {
      const {singlePostNoCommentsMock} = await import('../../mocks/singlePost')
      return HttpResponse.json(singlePostNoCommentsMock)
    }

    // Use the new single post mock for better test data
    const {singlePostMock} = await import('../../mocks/singlePost')
    return HttpResponse.json(singlePostMock)
  }

  // Post comments (general pattern for comments pages)
  const commentsRegex = /^\/r\/[^/]+\/comments\/[^/]+/
  if (commentsRegex.exec(path)) {
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
  return null
}

/**
 * Handle popular subreddits requests
 */
function handlePopularSubreddits(path: string): Response | null {
  if (!path.includes('/subreddits/popular.json')) {
    return null
  }

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

/**
 * Handle subreddit posts requests
 */
function handleSubredditPosts(path: string): Response | null {
  const subredditPostsRegex = /\/r\/[^/]+\/(hot|new|top)\.json/
  if (!subredditPostsRegex.exec(path)) {
    return null
  }

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

/**
 * Handle subreddit-related requests (about, popular, search, posts)
 */
function handleSubredditRequests(path: string): Response | null {
  // Subreddit about
  if (path.includes('/about.json')) {
    const subreddit = path.split('/')[2] // Extract subreddit from /r/subreddit/about.json
    if (subreddit === 'notarealsubreddit') {
      return new HttpResponse(null, {status: 404})
    }
    return HttpResponse.json(aboutMock)
  }

  // Popular subreddits
  const popularResponse = handlePopularSubreddits(path)
  if (popularResponse) return popularResponse

  // Subreddit search autocomplete
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

  // Subreddit posts
  const postsResponse = handleSubredditPosts(path)
  if (postsResponse) return postsResponse

  return null
}

/**
 * Main handler for Reddit API proxy requests
 */
async function handleRedditApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.searchParams.get('path')

  if (!path) {
    return new HttpResponse(null, {status: 400})
  }

  // Try each handler in order
  const userProfileResponse = handleUserProfile(path)
  if (userProfileResponse) return userProfileResponse

  const userPostsResponse = handleUserPosts(path)
  if (userPostsResponse) return userPostsResponse

  const userCommentsResponse = handleUserComments(path)
  if (userCommentsResponse) return userCommentsResponse

  const postCommentsResponse = await handlePostComments(path)
  if (postCommentsResponse) return postCommentsResponse

  const subredditResponse = handleSubredditRequests(path)
  if (subredditResponse) return subredditResponse

  // Fallback for unknown paths
  return new HttpResponse(null, {status: 404})
}

export const proxyHandlers = [
  // Handle both wildcard and exact API endpoint patterns
  http.get('*/api/reddit', async ({request}) =>
    handleRedditApiRequest(request)
  ),
  http.get('/api/reddit', async ({request}) => handleRedditApiRequest(request))
]
