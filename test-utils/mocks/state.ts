import type {UserSettings} from '@/lib/types'

/**
 * Mock state for testing.
 */
export const mockUserSettings: UserSettings = {
  favorites: [],
  currentSort: 'hot',
  currentSubreddit: null,
  enableNsfw: false,
  isMuted: false,
  recent: [],
  searchHistory: [],
  commentSort: 'best'
}

/**
 * Default preloaded state for tests.
 */
export const mockPreloadedState = {
  settings: mockUserSettings,
  transient: {
    toggleNavbar: false,
    mobileSearchState: 'closed' as const,
    searchQuery: ''
  }
}
