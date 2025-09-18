import {renderHook, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {useInfinitePosts} from './useInfinitePosts'

const subreddit = 'reactjs'
const preloadedState = {
  settings: {
    favorites: [],
    currentSort: 'hot' as const,
    currentSubreddit: null,
    enableNsfw: false,
    isMuted: false,
    recent: []
  },
  transient: {toggleNavbar: false, toggleSearch: false, searchQuery: ''}
}

describe('useInfinitePosts', () => {
  beforeAll(() => {
    server.use(
      http.get('https://oauth.reddit.com/r/allnsfw/hot.json', () =>
        HttpResponse.json({
          kind: 'Listing',
          data: {
            after: null,
            dist: 1,
            modhash: '',
            geo_filter: '',
            children: [
              {kind: 't3', data: {id: '1', over_18: true}},
              {kind: 't3', data: {id: '2', over_18: true}}
            ]
          }
        })
      )
    )
  })

  it('returns filteredData, noVisiblePosts, wasFiltered', () => {
    const {result} = renderHook(() => useInfinitePosts({subreddit}), {
      preloadedState
    })
    return waitFor(() => {
      expect(result.current.data).toBeDefined()
    })
      .then(() => {
        expect(result.current.data?.pages?.[0]?.data?.children?.length).toBe(2)
      })
      .then(() => {
        expect(result.current.noVisiblePosts).toBe(false)
      })
      .then(() => {
        expect(result.current.wasFiltered).toBe(false)
      })
  })

  it('filters out NSFW posts if enableNsfw is false', () => {
    const {result} = renderHook(() => useInfinitePosts({subreddit}), {
      preloadedState
    })
    return waitFor(() => {
      expect(result.current.data).toBeDefined()
    }).then(() => {
      expect(result.current.data?.pages?.[0]?.data?.children?.length).toBe(2)
    })
  })

  it('does not filter out NSFW posts if enableNsfw is true', () => {
    const nsfwState = {
      ...preloadedState,
      settings: {...preloadedState.settings, enableNsfw: true}
    }
    const {result} = renderHook(() => useInfinitePosts({subreddit}), {
      preloadedState: nsfwState
    })
    return waitFor(() => {
      expect(result.current.data).toBeDefined()
    }).then(() => {
      expect(result.current.data?.pages?.[0]?.data?.children?.length).toBe(2)
    })
  })

  it('returns undefined data if query.data is undefined', () => {
    server.use(
      http.get('https://oauth.reddit.com/r/reactjs/hot.json', () =>
        HttpResponse.json({})
      )
    )
    const {result} = renderHook(() => useInfinitePosts({subreddit}), {
      preloadedState
    })
    expect(result.current.data).toBeUndefined()
    expect(result.current.noVisiblePosts).toBe(false)
    expect(result.current.wasFiltered).toBe(false)
  })
})
