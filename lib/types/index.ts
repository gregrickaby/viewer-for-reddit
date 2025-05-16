/**
 * Next.js dynamic route parameters.
 */
export type Params = Promise<{slug: string}>
export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined
}>

/**
 * Valid sorting options for Reddit posts.
 */
export type SortingOption = 'hot' | 'new' | 'top' | 'controversial' | 'rising'

/**
 * Subreddit shape used internally throughout the app for:
 * - Favorites
 * - Recent history
 * - Search results
 */
export interface SubredditItem {
  display_name: string
  icon_img?: string
  over18: boolean
  public_description?: string
  subscribers: number
  value: string
}

/**
 * User settings persisted in localStorage.
 */
export interface UserSettings {
  currentSort: SortingOption // Current post sorting method
  currentSubreddit: string | null // Currently selected subreddit
  enableNsfw: boolean // NSFW content toggle
  favorites: SubredditItem[] // Favorite subreddits
  isMuted: boolean // Mute audio in video posts
  recent: SubredditItem[] // Recently visited subreddits
}

/**
 * HLS player component props.
 */
export interface HlsPlayerProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'data-hint'> {
  dataHint?: string
  src?: string
  fallbackUrl?: string
}
