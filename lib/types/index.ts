/**
 * Utility types for the application.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: unknown[]) => unknown
    ? T[K]
    : T[K] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K]
}

/**
 * Next.js dynamic route parameters.
 *
 * Note: Next.js provides auto-generated PageProps<RouteType> helpers, but for explicit typing
 * we define specific parameter types for each route pattern.
 */
export type SubredditParams = Promise<{subreddit: string}>
export type UserParams = Promise<{username: string}>
export type SinglePostParams = Promise<{subreddit: string; postId: string}>
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
  fromSearch?: boolean // Flag to indicate this item came from search results
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
  searchHistory: SubredditItem[] // Recent search history (max 10)
}

/**
 * HLS player component props.
 */
export interface HlsPlayerProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'data-hint'> {
  dataHint?: string
  src?: string
  fallbackUrl?: string
  hotkeys?: boolean
  gesturesDisabled?: boolean
  defaultStreamType?: 'on-demand' | 'live' | 'unknown'
  breakpoints?: string
}

/**
 * Reddit OAuth 2.0 token response.
 * Follows RFC 6749 standard for OAuth 2.0 access token responses.
 *
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
 */
export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  error?: string
}
