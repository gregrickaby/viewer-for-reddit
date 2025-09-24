import {http, HttpResponse} from 'msw'
import {userCommentsEmptyMock, userCommentsMock} from '../../mocks/userComments'
import {userPostsEmptyMock, userPostsMock} from '../../mocks/userPosts'
import {userNotFoundMock, userProfileMock} from '../../mocks/userProfile'

export const userHandlers = [
  // User profile
  http.get('https://oauth.reddit.com/user/:username/about.json', ({params}) => {
    const {username} = params

    if (username === 'nonexistentuser') {
      return HttpResponse.json(userNotFoundMock, {status: 404})
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

      return HttpResponse.json(userCommentsMock)
    }
  )
]
