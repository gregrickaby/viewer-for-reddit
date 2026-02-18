/**
 * Manual Reddit types for application use
 *
 * These types are simplified/flattened versions of the Reddit API responses.
 * For auto-generated API response types, see reddit-api.ts (generated from OpenAPI spec).
 *
 * Pattern: Use codegen types from reddit-api.ts for API responses, then transform
 * to these simplified types for use throughout the application.
 */

import type {components} from './reddit-api'

// ============================================================================
// Type Aliases for API Responses (from codegen)
// ============================================================================

/**
 * Subreddit posts listing from API
 * @see GetSubredditPostsResponse in reddit-api.ts
 */
export type ApiSubredditPostsResponse =
  components['schemas']['GetSubredditPostsResponse']

/**
 * Subreddit information from API
 * @see GetSubredditAboutResponse in reddit-api.ts
 */
export type ApiSubredditAboutResponse =
  components['schemas']['GetSubredditAboutResponse']

/**
 * User profile from API
 * @see GetUserProfileResponse in reddit-api.ts
 */
export type ApiUserProfileResponse =
  components['schemas']['GetUserProfileResponse']

/**
 * Search results from API
 * @see SearchSubredditsResponse in reddit-api.ts
 */
export type ApiSearchSubredditsResponse =
  components['schemas']['SearchSubredditsResponse']

/**
 * Popular subreddits from API
 * @see GetPopularSubredditsResponse in reddit-api.ts
 */
export type ApiPopularSubredditsResponse =
  components['schemas']['GetPopularSubredditsResponse']

// ============================================================================
// Simplified Application Types
// ============================================================================

/**
 * Simplified Reddit Post interface for application use
 * Transformed from GetSubredditPostsResponse API type
 */
export interface RedditPost {
  id: string
  name: string
  title: string
  author: string
  subreddit: string
  subreddit_name_prefixed: string
  score: number
  num_comments: number
  created_utc: number
  thumbnail: string
  url: string
  permalink: string
  selftext?: string
  selftext_html?: string
  is_video: boolean
  is_gallery?: boolean
  media?: RedditMedia
  preview?: RedditPreview
  gallery_data?: RedditGallery
  media_metadata?: RedditMediaMetadata
  over_18: boolean
  stickied: boolean
  link_flair_text?: string
  ups: number
  downs: number
  likes?: boolean | null
  saved?: boolean
}

export interface RedditMedia {
  reddit_video?: {
    fallback_url: string
    hls_url: string
    width: number
    height: number
    duration: number
  }
  oembed?: {
    provider_name: string
    provider_url: string
    type: string
    html?: string
  }
}

export interface RedditPreview {
  images: Array<{
    source: {
      url: string
      width: number
      height: number
    }
    resolutions: Array<{
      url: string
      width: number
      height: number
    }>
    variants?: {
      gif?: {
        source: {
          url: string
          width: number
          height: number
        }
        resolutions: Array<{
          url: string
          width: number
          height: number
        }>
      }
      mp4?: {
        source: {
          url: string
          width: number
          height: number
        }
        resolutions: Array<{
          url: string
          width: number
          height: number
        }>
      }
    }
  }>
  enabled: boolean
  reddit_video_preview?: {
    fallback_url: string
    hls_url: string
    width: number
    height: number
    duration: number
  }
}

export interface RedditGallery {
  items: Array<{
    media_id: string
    id: number
    caption?: string
  }>
}

export interface RedditMediaMetadata {
  [key: string]: {
    status: string
    e: string
    m?: string
    s?: {
      y: number
      x: number
      u?: string
      gif?: string
    }
    p?: Array<{
      y: number
      x: number
      u: string
    }>
  }
}

export interface GalleryItem {
  id: string
  url: string
  width: number
  height: number
  caption?: string
}

export interface RedditComment {
  id: string
  name: string
  author: string
  body: string
  body_html: string
  created_utc: number
  score: number
  depth: number
  replies?: RedditCommentListing
  parent_id: string
  permalink: string
  stickied: boolean
  distinguished?: string
  likes?: boolean | null
  score_hidden: boolean
  saved?: boolean
}

export interface RedditCommentListing {
  kind: 'Listing'
  data: {
    children: Array<{
      kind: 't1' | 'more'
      data: RedditComment | {id: string; children: string[]}
    }>
  }
}

export interface RedditListing<T> {
  kind: 'Listing'
  data: {
    after: string | null
    before: string | null
    children: Array<{
      kind: string
      data: T
    }>
    dist: number
  }
}

export interface RedditUser {
  name: string
  id: string
  icon_img: string
  created_utc: number
  link_karma: number
  comment_karma: number
  total_karma: number
  is_gold: boolean
  is_mod: boolean
  has_verified_email: boolean
  is_friend?: boolean
}

export interface RedditSubreddit {
  display_name: string
  display_name_prefixed: string
  title: string
  public_description: string
  description: string
  description_html: string
  subscribers: number
  active_user_count: number
  icon_img: string
  banner_img: string
  header_img: string
  community_icon: string
  created_utc: number
  over18: boolean
  url: string
  user_is_subscriber?: boolean
}

export interface SubredditItem {
  name: string
  displayName: string
  icon?: string
  subscribers?: number
  over18?: boolean
}

export interface SearchAutocompleteItem {
  /** Subreddit name or username (without r/ or u/ prefix) */
  name: string
  /** Display name with prefix: r/subreddit or u/username */
  displayName: string
  icon?: string
  subscribers?: number
  over18?: boolean
  /** Distinguishes subreddits from user profiles */
  type: 'subreddit' | 'user'
}

export interface RedditFollowing {
  name: string
  id: string
  date: number
  note?: string
}

export type SortOption = 'hot' | 'new' | 'top' | 'rising' | 'controversial'
export type CommentSortOption =
  | 'best'
  | 'top'
  | 'new'
  | 'controversial'
  | 'old'
  | 'qa'
export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'

export interface SessionData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  username: string
  userId: string
}

export interface PostWithComments {
  post: RedditPost
  comments: RedditComment[]
}

/**
 * Saved item that can be either a post or a comment
 */
export type SavedItem =
  | {type: 'post'; data: RedditPost}
  | {
      type: 'comment'
      data: RedditComment & {
        link_title?: string
        link_url?: string
        subreddit?: string
      }
    }

export interface SubredditInfo {
  display_name: string
  display_name_prefixed: string
  title: string
  public_description: string
  description?: string
  description_html?: string
  subscribers: number
  active_user_count?: number
  icon_img?: string
  banner_img?: string
  community_icon?: string
  created_utc: number
  over18: boolean
  url: string
  user_is_subscriber?: boolean
}
