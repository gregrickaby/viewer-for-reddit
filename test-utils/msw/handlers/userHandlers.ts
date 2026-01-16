import {http, HttpResponse} from 'msw'
import {
  savedPostsEmptyMock,
  savedPostsMock,
  savedPostsWithCommentsMock,
  savedPostsWithStickiedMock
} from '../../mocks/savedPosts'
import {userCommentsEmptyMock, userCommentsMock} from '../../mocks/userComments'
import {userPostsEmptyMock, userPostsMock} from '../../mocks/userPosts'
import {
  adminUserMock,
  emailVerifiedUserMock,
  emptyUserMock,
  goldUserMock,
  limitedUserMock,
  userNotFoundMock,
  userProfileMock
} from '../../mocks/userProfile'

export const userHandlers = [
  // User profile
  http.get('https://oauth.reddit.com/user/:username/about.json', ({params}) => {
    const {username} = params

    if (username === 'nonexistentuser') {
      return HttpResponse.json(userNotFoundMock, {status: 404})
    }

    if (username === 'emailverified') {
      return HttpResponse.json(emailVerifiedUserMock)
    }

    if (username === 'adminuser') {
      return HttpResponse.json(adminUserMock)
    }

    if (username === 'golduser') {
      return HttpResponse.json(goldUserMock)
    }

    if (username === 'limiteduser') {
      return HttpResponse.json(limitedUserMock)
    }

    if (username === 'emptyuser') {
      return HttpResponse.json(emptyUserMock)
    }

    return HttpResponse.json(userProfileMock)
  }),

  // User posts
  http.get(
    'https://oauth.reddit.com/user/:username/submitted.json',
    ({params, request}) => {
      const {username} = params
      const url = new URL(request.url)
      const after = url.searchParams.get('after')

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }

      if (username === 'emptyuser' || after === 'no-more-posts') {
        return HttpResponse.json(userPostsEmptyMock)
      }

      if (username === 'limiteduser') {
        // Return posts without 'after' to indicate no more pages
        return HttpResponse.json({
          ...userPostsMock,
          data: {
            ...userPostsMock.data,
            after: null // No more pages available
          }
        })
      }

      return HttpResponse.json(userPostsMock)
    }
  ),

  // User comments
  http.get(
    'https://oauth.reddit.com/user/:username/comments.json',
    ({params, request}) => {
      const {username} = params
      const url = new URL(request.url)
      const after = url.searchParams.get('after')

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }

      if (username === 'emptyuser' || after === 'no-more-comments') {
        return HttpResponse.json(userCommentsEmptyMock)
      }

      if (username === 'limiteduser') {
        // Return comments without 'after' to indicate no more pages
        return HttpResponse.json({
          ...userCommentsMock,
          data: {
            ...userCommentsMock.data,
            after: null // No more pages available
          }
        })
      }

      return HttpResponse.json(userCommentsMock)
    }
  ),

  // User saved posts
  http.get(
    'https://oauth.reddit.com/user/:username/saved.json',
    ({params, request}) => {
      const {username} = params
      const url = new URL(request.url)
      const after = url.searchParams.get('after')

      if (username === 'nonexistentuser') {
        return HttpResponse.json(userNotFoundMock, {status: 404})
      }

      if (username === 'emptyuser' || after === 'no-more-saved') {
        return HttpResponse.json(savedPostsEmptyMock)
      }

      if (username === 'limiteduser') {
        // Return saved posts without 'after' to indicate no more pages
        return HttpResponse.json({
          ...savedPostsMock,
          data: {
            ...savedPostsMock.data,
            after: null // No more pages available
          }
        })
      }

      if (username === 'userWithComments') {
        return HttpResponse.json(savedPostsWithCommentsMock)
      }

      if (username === 'userWithStickied') {
        return HttpResponse.json(savedPostsWithStickiedMock)
      }

      return HttpResponse.json(savedPostsMock)
    }
  )
]
