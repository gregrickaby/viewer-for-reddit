import type { RedditSubreddit } from './reddit'

/**
 * Valid sorting options for Reddit posts.
 */
export type SortingOption = 'hot' | 'new' | 'top' | 'latest'
/**
 * User settings persisted in localStorage.
 */
export interface UserSettings {
  darkMode: boolean // Theme preference
  currentSort: SortingOption // Current post sorting method
  enableNsfw: boolean // NSFW content toggle
  likedPosts: Record<string, number> // Map of post IDs to timestamp of like
  recentSubreddits: RedditSubreddit[] // Recently visited subreddits
  currentSubreddit: string | null // Currently selected subreddit
  isMuted: boolean // Mute audio in video posts
  showRecent: boolean // Show recent subreddits modal
  showSettings: boolean // Settings modal visibility
  showSearch: boolean // Search modal visibility
  showAbout: boolean // About modal visibility
  isAppLoading: boolean // Loading state for the app
  authToken: string | null // Reddit API access token
}
