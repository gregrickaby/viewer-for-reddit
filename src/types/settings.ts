import type { RedditSubreddit } from './reddit'

/**
 * Valid sorting options for Reddit posts.
 */
export type SortingOption = 'hot' | 'new' | 'top' | 'latest'
/**
 * User settings persisted in localStorage.
 */
export interface UserSettings {
  currentSort: SortingOption // Current post sorting method
  currentSubreddit: string | null // Currently selected subreddit
  darkMode: boolean // Theme preference
  enableNsfw: boolean // NSFW content toggle
  favorites: RedditSubreddit[] // Favorite subreddits
  isAppLoading: boolean // Loading state for the app
  isMuted: boolean // Mute audio in video posts
  recent: RedditSubreddit[] // Recently visited subreddits
  showAbout: boolean // About modal visibility
  showFavorites: boolean // Favorites modal visibility
  showRecent: boolean // Show recent subreddits modal
  showSearch: boolean // Search modal visibility
  showSettings: boolean // Settings modal visibility
}
