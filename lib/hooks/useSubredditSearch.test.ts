import {act, renderHook} from '@/test-utils'
import {useSubredditSearch} from './useSubredditSearch'

describe('useSubredditSearch', () => {
  it('returns initial state from Redux', () => {
    const {result} = renderHook(() => useSubredditSearch())
    expect(result.current.query).toBe('')
    expect(Array.isArray(result.current.autoCompleteData)).toBe(true)
  })

  it('setQuery updates the Redux state', () => {
    const {result} = renderHook(() => useSubredditSearch())
    act(() => {
      result.current.setQuery('reactjs')
    })
    expect(result.current.query).toBe('reactjs')
  })

  it('returns search results when query is non-empty', async () => {
    const {result} = renderHook(() => useSubredditSearch(), {
      preloadedState: {
        transient: {
          toggleNavbar: false,
          toggleSearch: false,
          searchQuery: 'reactjs'
        }
      }
    })
    expect(result.current.query).toBe('reactjs')
    expect(Array.isArray(result.current.autoCompleteData)).toBe(true)
  })

  it('returns popular subreddits when query is empty', () => {
    const {result} = renderHook(() => useSubredditSearch(), {
      preloadedState: {
        transient: {
          toggleNavbar: false,
          toggleSearch: false,
          searchQuery: ''
        }
      }
    })
    expect(result.current.query).toBe('')
    expect(Array.isArray(result.current.autoCompleteData)).toBe(true)
  })
})
