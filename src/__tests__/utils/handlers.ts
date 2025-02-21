import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://reddit.com/r/:subreddit.json', () => {
    return HttpResponse.json({
      data: {
        children: []
      }
    })
  })
]
