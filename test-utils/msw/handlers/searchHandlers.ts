import {http, HttpResponse} from 'msw'
import {searchMock} from '../../mocks/search'

export const searchHandlers = [
  // Search Reddit
  http.get('https://oauth.reddit.com/search.json', ({request}) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    const after = url.searchParams.get('after')

    return HttpResponse.json({
      data: {
        children: [
          {
            data: {
              id: 'search1',
              title: `Search result for "${q}"`,
              author: 'testuser',
              score: 50
            }
          }
        ],
        after: after ? null : 't3_search_next'
      }
    })
  }),

  // Search Reddit (unauthenticated)
  http.get('https://www.reddit.com/search.json', ({request}) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    const after = url.searchParams.get('after')

    return HttpResponse.json({
      data: {
        children: [
          {
            data: {
              id: 'search1',
              title: `Search result for "${q}"`,
              author: 'testuser',
              score: 50
            }
          }
        ],
        after: after ? null : 't3_search_next'
      }
    })
  }),

  // Subreddit autocomplete
  http.get(
    'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
    ({request}) => {
      const url = new URL(request.url)
      const query = url.searchParams.get('query')

      if (!query || query.length < 3) {
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

      if (query === 'filter') {
        // Test case with results that need filtering
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            dist: 3,
            modhash: '',
            geo_filter: '',
            children: [
              {
                kind: 't5',
                data: {
                  display_name: 'validsubreddit',
                  public_description: 'Valid subreddit',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 1000
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: null, // Missing name - should be filtered
                  public_description: 'Invalid subreddit',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 500
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: '', // Empty name - should be filtered
                  public_description: 'Another invalid',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 300
                }
              }
            ]
          }
        })
      }

      if (query === 'nsfw') {
        // Test NSFW counting
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            dist: 3,
            modhash: '',
            geo_filter: '',
            children: [
              {
                kind: 't5',
                data: {
                  display_name: 'sfw1',
                  public_description: 'SFW subreddit 1',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 1000,
                  over18: false
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: 'nsfw1',
                  public_description: 'NSFW subreddit 1',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 800,
                  over18: true
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: 'nsfw2',
                  public_description: 'NSFW subreddit 2',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 600,
                  over18: true
                }
              }
            ]
          }
        })
      }

      return HttpResponse.json(searchMock)
    }
  ),

  // Unauthenticated subreddit autocomplete
  http.get(
    'https://www.reddit.com/api/subreddit_autocomplete_v2.json',
    ({request}) => {
      const url = new URL(request.url)
      const query = url.searchParams.get('query')

      if (!query || query.length < 3) {
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
  )
]
