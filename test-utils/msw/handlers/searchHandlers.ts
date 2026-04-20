import type {RedditAutocompleteResponse} from '@/lib/types/reddit'
import {http, HttpResponse} from 'msw'
import {searchMock} from '../../mocks/search'

export const searchHandlers = [
  // Search Reddit (OAuth endpoint - authenticated)
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

  // Search Reddit (public endpoint - anonymous)
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

  // Subreddit autocomplete (OAuth endpoint - authenticated)
  http.get(
    'https://oauth.reddit.com/api/subreddit_autocomplete_v2.json',
    ({request}) => {
      const url = new URL(request.url)
      const query = url.searchParams.get('query')

      if (!query || query.length < 3) {
        return HttpResponse.json<RedditAutocompleteResponse>({
          kind: 'Listing',
          data: {
            after: null,
            before: null,
            dist: 0,
            children: []
          }
        })
      }

      if (query === 'filter') {
        // Test case with results that need filtering
        return HttpResponse.json<RedditAutocompleteResponse>({
          kind: 'Listing',
          data: {
            after: null,
            before: null,
            dist: 3,
            children: [
              {
                kind: 't5',
                data: {
                  display_name: 'validsubreddit',
                  display_name_prefixed: 'r/validsubreddit',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 1000,
                  over18: false
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: '', // Missing name — filtered by action
                  display_name_prefixed: '',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 500,
                  over18: false
                }
              },
              {
                kind: 't5',
                data: {
                  display_name: '', // Empty name — filtered by action
                  display_name_prefixed: '',
                  community_icon: '',
                  icon_img: '',
                  subscribers: 300,
                  over18: false
                }
              }
            ]
          }
        })
      }

      if (query === 'nsfw') {
        // Test NSFW counting
        return HttpResponse.json<RedditAutocompleteResponse>({
          kind: 'Listing',
          data: {
            after: null,
            before: null,
            dist: 3,
            children: [
              {
                kind: 't5',
                data: {
                  display_name: 'sfw1',
                  display_name_prefixed: 'r/sfw1',
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
                  display_name_prefixed: 'r/nsfw1',
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
                  display_name_prefixed: 'r/nsfw2',
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
  )
]
