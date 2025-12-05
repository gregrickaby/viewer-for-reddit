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
export type SinglePostParams = Promise<{
  subreddit: string
  postId: string
  slug?: string[]
}>
export type CustomFeedParams = Promise<{
  username: string
  customfeed: string
}>
export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined
}>
export interface SinglePostPageParams {
  params: Readonly<
    Promise<{subreddit: string; postId: string; slug?: string[]}>
  >
}

/**
 * Valid sorting options for Reddit posts.
 */
export type SortingOption = 'hot' | 'new' | 'top' | 'controversial' | 'rising'

/**
 * Valid sorting options for Reddit comments.
 */
export type CommentSortingOption = 'best' | 'top' | 'new' | 'controversial'

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
  commentSort: CommentSortingOption // Current comment sorting method
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
export interface HlsPlayerProps extends Omit<
  React.VideoHTMLAttributes<HTMLVideoElement>,
  'data-hint'
> {
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

/**
 * Vote direction for Reddit posts and comments.
 * - 1: Upvote
 * - 0: Unvote (remove existing vote)
 * - -1: Downvote
 */
export type VoteDirection = 1 | 0 | -1

/**
 * Vote request payload for Reddit API.
 */
export interface VoteRequest {
  /** Thing fullname (e.g., t1_abc123 for comment, t3_xyz789 for post) */
  id: string
  /** Vote direction: 1 (upvote), 0 (unvote), -1 (downvote) */
  dir: VoteDirection
}

/**
 * Vote response from Reddit API.
 */
export interface VoteResponse {
  success: boolean
  error?: string
}

/**
 * Save request payload for Reddit API.
 */
export interface SaveRequest {
  /** Post fullname (e.g., t3_abc123) */
  id: string
  /** Save (true) or unsave (false) */
  save: boolean
}

/**
 * Save response from Reddit API.
 */
export interface SaveResponse {
  success: boolean
  id: string
  saved: boolean
  error?: string
}

/**
 * Comment submission request payload.
 */
export interface SubmitCommentRequest {
  /** Thing fullname of parent (e.g., t1_abc123 for comment, t3_xyz789 for post) */
  thing_id: string
  /** Raw markdown body of the comment */
  text: string
}

/**
 * Comment submission response from Reddit API.
 */
export interface SubmitCommentResponse {
  success: boolean
  comment?: {
    id: string
    name: string
    body: string
    author: string
    created_utc: number
  }
  error?: string
  scope_required?: string
  message?: string
}

/**
 * Comment deletion request payload.
 */
export interface DeleteCommentRequest {
  /** Comment fullname (e.g., t1_abc123) */
  id: string
}

/**
 * Comment deletion response from Reddit API.
 */
export interface DeleteCommentResponse {
  success: boolean
  error?: string
  scope_required?: string
  message?: string
}
