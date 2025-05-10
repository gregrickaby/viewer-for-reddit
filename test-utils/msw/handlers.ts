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
  http.get('https://reddit.com/r/:slug/about.json', () => {
    return HttpResponse.json(aboutMock)
  }),

  // Popular subreddits
  http.get('https://www.reddit.com/subreddits/popular/.json', () => {
    return HttpResponse.json(popularMock)
  }),

  // Subreddit search autocomplete
  http.get('https://oauth.reddit.com/api/subreddit_autocomplete_v2', () => {
    return HttpResponse.json(searchMock)
  }),

  // Subreddit posts
  http.get('https://oauth.reddit.com/r/:slug/:sort/.json', () => {
    return HttpResponse.json(subredditMock)
  })
]
