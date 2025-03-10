import type { RootState } from '@/lib/store'

/**
 * Base state that other states can extend from.
 */
export const baseState: Partial<RootState> = {
  settings: {
    currentSort: 'hot',
    currentSubreddit: 'aww',
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
