import {http, HttpResponse} from 'msw'

export const voteHandlers = [
  // App API route handler - default success response
  // Tests can override with server.use() for specific error cases
  http.post('http://localhost:3000/api/reddit/vote', () => {
    return HttpResponse.json({success: true})
  }),

  // Reddit OAuth API handler - default success response
  // Tests can override with server.use() for specific error cases
  http.post('https://oauth.reddit.com/api/vote', () => {
    return HttpResponse.json({})
  })
]
