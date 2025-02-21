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
    showRecent: false,
    showFavorites: false,
    showSettings: false,
    showSearch: false,
    showAbout: false
  }
}
