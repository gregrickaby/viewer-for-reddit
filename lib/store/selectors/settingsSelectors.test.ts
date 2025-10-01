import type {RootState} from '@/lib/store'
import {
  selectFavoriteSubreddits,
  selectHasFavorites,
  selectHasRecent,
  selectRecentSubreddits,
  selectSearchHistory,
  selectSettings
} from '@/lib/store/selectors/settingsSelectors'
import type {SubredditItem} from '@/lib/types'

// Mock subreddit items for testing
const mockSubredditItem: SubredditItem = {
  display_name: 'reactjs',
  subscribers: 100000,
  public_description: 'A subreddit for React developers',
  over18: false,
  value: 'reactjs'
}

const mockSubredditItem2: SubredditItem = {
  display_name: 'typescript',
  subscribers: 50000,
  public_description: 'TypeScript community',
  over18: false,
  value: 'typescript'
}

// Mock state for testing
const createMockState = (
  overrides?: Partial<RootState['settings']>
): RootState => ({
  auth: {
    isAuthenticated: false,
    username: null,
    expiresAt: null
  },
  settings: {
    currentSort: 'hot',
    currentSubreddit: 'all',
    enableNsfw: false,
    isMuted: false,
    favorites: [],
    recent: [],
    searchHistory: [],
    ...overrides
  },
  transient: {
    toggleNavbar: false,
    mobileSearchState: 'closed',
    searchQuery: ''
  },
  postsApi: {} as any,
  searchApi: {} as any,
  commentsApi: {} as any,
  userApi: {} as any,
  subredditApi: {} as any
})

describe('settingsSelectors', () => {
  describe('selectSettings', () => {
    it('should return the settings state', () => {
      const mockState = createMockState()
      const result = selectSettings(mockState)
      expect(result).toEqual(mockState.settings)
    })
  })

  describe('selectFavoriteSubreddits', () => {
    it('should return empty array when no favorites', () => {
      const mockState = createMockState()
      const result = selectFavoriteSubreddits(mockState)
      expect(result).toEqual([])
    })

    it('should return favorite display names', () => {
      const mockState = createMockState({
        favorites: [mockSubredditItem, mockSubredditItem2]
      })
      const result = selectFavoriteSubreddits(mockState)
      expect(result).toEqual(['reactjs', 'typescript'])
    })
  })

  describe('selectHasFavorites', () => {
    it('should return false when no favorites', () => {
      const mockState = createMockState()
      const result = selectHasFavorites(mockState)
      expect(result).toBe(false)
    })

    it('should return true when favorites exist', () => {
      const mockState = createMockState({
        favorites: [mockSubredditItem]
      })
      const result = selectHasFavorites(mockState)
      expect(result).toBe(true)
    })
  })

  describe('selectRecentSubreddits', () => {
    it('should return empty array when no recent subreddits', () => {
      const mockState = createMockState()
      const result = selectRecentSubreddits(mockState)
      expect(result).toEqual([])
    })

    it('should return recent display names', () => {
      const mockState = createMockState({
        recent: [mockSubredditItem, mockSubredditItem2]
      })
      const result = selectRecentSubreddits(mockState)
      expect(result).toEqual(['reactjs', 'typescript'])
    })
  })

  describe('selectHasRecent', () => {
    it('should return false when no recent subreddits', () => {
      const mockState = createMockState()
      const result = selectHasRecent(mockState)
      expect(result).toBe(false)
    })

    it('should return true when recent subreddits exist', () => {
      const mockState = createMockState({
        recent: [mockSubredditItem]
      })
      const result = selectHasRecent(mockState)
      expect(result).toBe(true)
    })
  })

  describe('selectSearchHistory', () => {
    it('should return empty array when no search history', () => {
      const mockState = createMockState()
      const result = selectSearchHistory(mockState)
      expect(result).toEqual([])
    })

    it('should return search history items', () => {
      const searchHistoryItems: SubredditItem[] = [
        {
          display_name: 'reactjs',
          subscribers: 100000,
          public_description: 'React community',
          over18: false,
          value: 'reactjs'
        },
        {
          display_name: 'typescript',
          subscribers: 50000,
          public_description: 'TypeScript community',
          over18: false,
          value: 'typescript'
        }
      ]
      const mockState = createMockState({
        searchHistory: searchHistoryItems
      })
      const result = selectSearchHistory(mockState)
      expect(result).toEqual(searchHistoryItems)
    })
  })
})
