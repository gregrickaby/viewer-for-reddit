import type { RootState } from '@/src/store/store'

/**
 * Base state that other states can extend from.
 */
export const baseState: Partial<RootState> = {
  settings: {
    currentSort: 'hot',
    currentSubreddit: 'aww',
    darkMode: false,
    enableNsfw: false,
    favorites: [],
    isMuted: true,
    recent: []
  },
  transient: {
    isAppLoading: true,
    showRecent: false,
    showFavorites: false,
    showSettings: false,
    showSearch: false,
    showAbout: false
  }
}

/**
 * State for when the app has finished loading.
 */
export const loadedState: Partial<RootState> = {
  ...baseState,
  transient: {
    isAppLoading: false,
    showRecent: false,
    showFavorites: false,
    showSettings: false,
    showSearch: false,
    showAbout: false
  }
}
