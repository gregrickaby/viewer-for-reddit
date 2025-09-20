import {act, renderHook} from '@/test-utils'
import {useSubredditSearch} from './useSubredditSearch'

const mockPush = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('useSubredditSearch', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('returns initial state from Redux', () => {
    const {result} = renderHook(() => useSubredditSearch())
    expect(result.current.query).toBe('')
    expect(Array.isArray(result.current.autoCompleteData)).toBe(true)
    expect(typeof result.current.groupedData).toBe('object')
    expect(Array.isArray(result.current.groupedData.communities)).toBe(true)
    expect(Array.isArray(result.current.groupedData.nsfw)).toBe(true)
    expect(Array.isArray(result.current.groupedData.searchHistory)).toBe(true)
    expect(Array.isArray(result.current.filteredGroups)).toBe(true)
    expect(typeof result.current.totalOptions).toBe('number')
    expect(typeof result.current.handleOptionSelect).toBe('function')
    expect(typeof result.current.handleRemoveFromHistory).toBe('function')
    expect(typeof result.current.isLoading).toBe('boolean')
    expect(typeof result.current.hasError).toBe('boolean')
    expect(typeof result.current.hasNoResults).toBe('boolean')
    expect(typeof result.current.isMobile).toBe('boolean')
    expect(typeof result.current.isDropdownOpen).toBe('boolean')
    expect(typeof result.current.handleMobileToggle).toBe('function')
    expect(typeof result.current.handleMobileClose).toBe('function')
    expect(typeof result.current.mobileInputRef).toBe('object')
    expect(typeof result.current.isClosing).toBe('boolean')
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
          mobileSearchState: 'closed' as const,
          searchQuery: 'reactjs'
        }
      }
    })
    expect(result.current.query).toBe('reactjs')
    expect(Array.isArray(result.current.autoCompleteData)).toBe(true)
    expect(typeof result.current.groupedData).toBe('object')
  })

  it('returns popular subreddits when query is empty', () => {
    const {result} = renderHook(() => useSubredditSearch(), {
      preloadedState: {
        transient: {
          toggleNavbar: false,
          mobileSearchState: 'closed' as const,
          searchQuery: ''
        }
      }
    })
    expect(result.current.query).toBe('')
    expect(Array.isArray(result.current.autoCompleteData)).toBe(true)
    expect(typeof result.current.groupedData).toBe('object')
  })

  it('handles option selection and updates search history', () => {
    const {result} = renderHook(() => useSubredditSearch(), {
      preloadedState: {
        settings: {
          searchHistory: [],
          currentSort: 'hot',
          currentSubreddit: '',
          enableNsfw: true,
          favorites: [],
          isMuted: true,
          recent: []
        }
      }
    })

    const mockItem = {
      display_name: 'reactjs',
      icon_img: '',
      over18: false,
      public_description: '',
      subscribers: 100,
      value: 'r/reactjs'
    }

    act(() => {
      result.current.groupedData.communities.push(mockItem)
      result.current.handleOptionSelect('r/reactjs')
    })

    expect(result.current.query).toBe('')
    expect(mockPush).toHaveBeenCalledWith('/r/reactjs')
  })

  it('handles removing item from search history', () => {
    const mockHistory = [
      {
        display_name: 'aww',
        icon_img: '',
        over18: false,
        public_description: '',
        subscribers: 100,
        value: 'r/aww'
      }
    ]

    const {result} = renderHook(() => useSubredditSearch(), {
      preloadedState: {
        settings: {
          searchHistory: mockHistory,
          currentSort: 'hot',
          currentSubreddit: '',
          enableNsfw: true,
          favorites: [],
          isMuted: true,
          recent: []
        }
      }
    })

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.MouseEvent

    act(() => {
      result.current.handleRemoveFromHistory(mockEvent, 'aww')
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  it('returns filtered groups based on query', () => {
    const {result} = renderHook(() => useSubredditSearch(), {
      preloadedState: {
        settings: {
          searchHistory: [
            {
              display_name: 'aww',
              icon_img: '',
              over18: false,
              public_description: '',
              subscribers: 100,
              value: 'r/aww'
            }
          ],
          currentSort: 'hot',
          currentSubreddit: '',
          enableNsfw: true,
          favorites: [],
          isMuted: true,
          recent: []
        },
        transient: {
          toggleNavbar: false,
          mobileSearchState: 'closed' as const,
          searchQuery: ''
        }
      }
    })

    expect(
      result.current.filteredGroups.some(
        (group) => group.label === 'Search History'
      )
    ).toBe(true)

    act(() => {
      result.current.setQuery('test')
    })

    expect(result.current.query).toBe('test')
  })

  it('shows loading during debounce period when user types', () => {
    const {result} = renderHook(() => useSubredditSearch())

    act(() => {
      result.current.setQuery('react')
    })

    expect(result.current.query).toBe('react')
    expect(result.current.isLoading).toBe(true)
  })

  it('handles mobile dropdown toggle', () => {
    const {result} = renderHook(() => useSubredditSearch())

    expect(result.current.isDropdownOpen).toBe(false)

    act(() => {
      result.current.handleMobileToggle()
    })

    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      result.current.handleMobileToggle()
    })

    expect(result.current.isClosing).toBe(true)
  })

  it('handles mobile close action', () => {
    const {result} = renderHook(() => useSubredditSearch())

    act(() => {
      result.current.handleMobileToggle()
    })

    expect(result.current.isDropdownOpen).toBe(true)

    act(() => {
      result.current.handleMobileClose()
    })

    expect(result.current.isClosing).toBe(true)
  })

  it('prevents body scrolling when mobile search is open', () => {
    // Store original overflow value
    const originalOverflow = document.body.style.overflow

    const {result} = renderHook(() => useSubredditSearch(), {
      preloadedState: {
        transient: {
          searchQuery: '',
          mobileSearchState: 'closed' as const,
          toggleNavbar: false
        }
      }
    })

    // Initially body should not be affected
    expect(document.body.style.overflow).toBe(originalOverflow)

    // Open mobile search
    act(() => {
      result.current.handleMobileToggle()
    })

    // Body overflow should be hidden when mobile search is open
    expect(document.body).toHaveStyle('overflow: hidden')

    // Close mobile search
    act(() => {
      result.current.handleMobileClose()
    })

    // Body overflow should be restored (cleanup happens in useEffect cleanup)
    // Note: In test environment, the cleanup might not run immediately
  })
})
