import {http, HttpResponse} from 'msw'

export const handlers = [
  // Token endpoint
  http.post('https://www.reddit.com/api/v1/access_token', async () => {
    return HttpResponse.json({
      access_token: 'mocked_access_token',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'read'
    })
  }),

  // Popular subreddits
  http.get('https://oauth.reddit.com/subreddits/popular/.json', () => {
    return HttpResponse.json({
      kind: 'Listing',
      data: {
        modhash: '',
        dist: 2,
        children: [
          {
            kind: 't5',
            data: {
              display_name: 'javascript',
              title: 'JavaScript',
              public_description: 'Discussion about JS',
              icon_img: '',
              subscribers: 1000000
            }
          },
          {
            kind: 't5',
            data: {
              display_name: 'reactjs',
              title: 'ReactJS',
              public_description: 'The React community',
              icon_img: '',
              subscribers: 800000
            }
          }
        ],
        after: null,
        before: null
      }
    })
  }),

  // Subreddit search autocomplete
  http.get(
    'https://oauth.reddit.com/api/subreddit_autocomplete_v2',
    ({request}) => {
      const url = new URL(request.url)
      const query = url.searchParams.get('query') || 'unknown'

      return HttpResponse.json({
        data: {
          children: [
            {
              kind: 't5',
              data: {
                display_name: `${query}_results`,
                title: `${query} Results`,
                public_description: `Search results for ${query}`
              }
            }
          ]
        }
      })
    }
  ),

  // Subreddit posts (hot, new, top, etc.)
  http.get('https://oauth.reddit.com/r/:slug/:sort/.json', ({params}) => {
    const {slug, sort} = params

    return HttpResponse.json({
      kind: 'Listing',
      data: {
        modhash: '',
        dist: 1,
        children: [
          {
            kind: 't3',
            data: {
              id: 'abc123',
              title: `Example post in r/${slug} (${sort})`,
              author: 'test_user',
              ups: 123,
              stickied: false
            }
          }
        ],
        after: null,
        before: null
      }
    })
  }),

  // Subreddit about
  http.get('https://oauth.reddit.com/r/:slug/about/.json', ({params}) => {
    const {slug} = params

    return HttpResponse.json({
      kind: 't5',
      data: {
        display_name: slug,
        title: `About r/${slug}`,
        public_description: `This is the about page for r/${slug}`,
        subscribers: 9999
      }
    })
  })
]
