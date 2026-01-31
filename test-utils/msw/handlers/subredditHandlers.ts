import {http, HttpResponse} from 'msw'
import {aboutMock} from '../../mocks/about'
import {popularMock} from '../../mocks/popular'
import {searchMock} from '../../mocks/search'
import {subredditMock} from '../../mocks/subreddit'

export const subredditHandlers = [
  // About subreddit (OAuth - authenticated)
  http.get('https://oauth.reddit.com/r/:slug/about.json', ({params}) => {
    const {slug} = params
    if (slug === 'notarealsubreddit') {
      return new HttpResponse(null, {status: 404})
    }
    return HttpResponse.json(aboutMock)
  }),

  // About subreddit (public - anonymous)
  http.get('https://www.reddit.com/r/:slug/about.json', ({params}) => {
    const {slug} = params
    if (slug === 'notarealsubreddit') {
      return new HttpResponse(null, {status: 404})
    }
    return HttpResponse.json(aboutMock)
  }),

  // Popular subreddits (OAuth)
  http.get('https://oauth.reddit.com/subreddits/popular.json', ({request}) => {
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit')

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
                // other required fields
                public_description: 'Test subreddit 1',
                community_icon: '',
                icon_img: ''
              }
            },
            {
              kind: 't5',
              data: {
                display_name: 'test2',
                // missing subscribers field to test ?? 0 fallback for a
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
                // missing subscribers field to test ?? 0 fallback for b
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
  }),

  // Subreddit search autocomplete (OAuth)
  http.get(
    'https://oauth.reddit.com/api/subreddit_autocomplete_v2',
    ({request}) => {
      const url = new URL(request.url)
      const query = url.searchParams.get('query')

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
  ),

  // Subreddit posts (OAuth - kept as is for multi/home tests)
  http.get('https://oauth.reddit.com/r/:slug/:sort.json', ({params}) => {
    const {slug} = params

    if (slug === 'notarealsubreddit') {
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

    if (slug === 'testfilter') {
      // Return posts with various edge cases to test filtering
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: 't3_test',
          dist: 5,
          modhash: '',
          geo_filter: '',
          children: [
            {
              kind: 't3',
              data: {
                title: 'Normal post',
                stickied: false,
                id: 'test1'
              }
            },
            {
              kind: 't3',
              data: {
                title: 'Stickied post',
                stickied: true,
                id: 'test2'
              }
            },
            {
              kind: 't3',
              data: {
                title: 'Another stickied post',
                stickied: true,
                id: 'test3'
              }
            },
            {
              kind: 't3'
              // missing data field to test child?.data check
            },
            {
              kind: 't3',
              data: null // null data to test child?.data check
            }
          ]
        }
      })
    }

    if (slug === 'testfilternull') {
      // Test case where children is null
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 0,
          modhash: '',
          geo_filter: '',
          children: null
        }
      })
    }

    if (slug === 'gaming+technology+programming') {
      // Test custom feeds request with + separators preserved
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 2,
          modhash: '',
          geo_filter: '',
          children: [
            {
              kind: 't3',
              data: {
                title: 'Gaming post from custom feeds',
                id: 'multi1',
                stickied: false
              }
            },
            {
              kind: 't3',
              data: {
                title: 'Technology post from custom feeds',
                id: 'multi2',
                stickied: false
              }
            }
          ]
        }
      })
    }

    if (slug === 'test%20space+normal') {
      // Test that individual subreddit names with spaces are encoded properly
      return HttpResponse.json({
        kind: 'Listing',
        data: {
          after: null,
          dist: 1,
          modhash: '',
          geo_filter: '',
          children: [
            {
              kind: 't3',
              data: {
                title: 'Post from encoded subreddit',
                id: 'encoded1',
                stickied: false
              }
            }
          ]
        }
      })
    }

    return HttpResponse.json(subredditMock)
  })
]
