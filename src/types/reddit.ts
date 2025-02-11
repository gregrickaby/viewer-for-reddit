/**
 * Base asset interface for images and videos.
 */
interface Asset {
  width: number
  height: number
}

/**
 * Image asset with URL.
 */
interface ImageAsset extends Asset {
  url: string
}

/**
 * Video asset with streaming URLs.
 */
interface VideoAsset extends Asset {
  dash_url: string
  fallback_url: string
  hls_url: string
  scrubber_media_url: string
  is_gif?: boolean
}

/**
 * Media preview for galleries.
 */
interface RedditMediaPreview extends Asset {
  u: string
}

/**
 * Source media for galleries.
 */
interface RedditMediaSource extends Asset {
  u?: string
  gif?: string
}

/**
 * Gallery item metadata.
 */
interface RedditMediaMetadataItem {
  status: 'valid' | 'failed'
  e: 'Image'
  m: string
  p: RedditMediaPreview[]
  s: RedditMediaSource
  id: string
}

/**
 * Gallery data structure.
 */
interface RedditGalleryItem {
  caption?: string
  media_id: string
  id: number
}

/**
 * Gallery data structure.
 */
interface RedditGalleryData {
  items: RedditGalleryItem[]
}

/**
 * Embedded media content.
 */
interface RedditOEmbed extends Asset {
  provider_name: string
  provider_url: string
  title: string
  html: string
  thumbnail_height: number
  thumbnail_width: number
  thumbnail_url: string
  type: string
}

/**
 * Embedded media content.
 */
interface RedditMediaEmbed extends Asset {
  content: string
  media_domain_url: string
  scrolling: boolean
}

/**
 * Image preview with variants.
 */
interface RedditImagePreview {
  source: ImageAsset
  resolutions: ImageAsset[]
  variants: {
    obfuscated?: {
      source: ImageAsset
      resolutions: ImageAsset[]
    }
    nsfw?: {
      source: ImageAsset
      resolutions: ImageAsset[]
    }
  }
}

/**
 * Core post data.
 */
export interface RedditPost {
  // Post identification.
  id: string
  author: string
  title: string
  permalink: string
  subreddit: string
  subreddit_name_prefixed: string
  subreddit_subscribers: number
  url: string

  // Post metadata.
  created_utc: number
  score: number
  ups: number
  num_comments: number
  stickied: boolean
  post_hint?: 'image' | 'hosted:video' | 'rich:video' | 'link'
  over_18: boolean
  is_video: boolean
  index: number
  selftext?: string

  // Media content.
  preview?: {
    images: RedditImagePreview[]
    reddit_video_preview?: VideoAsset
  }
  media?: {
    type: string
    reddit_video?: VideoAsset
    oembed?: RedditOEmbed
  }
  secure_media_embed?: RedditMediaEmbed
  video_preview?: VideoAsset
  thumbnail?: string

  // Gallery content.
  is_gallery?: boolean
  gallery_data?: RedditGalleryData
  media_metadata?: Record<string, RedditMediaMetadataItem>
}

/**
 * Reddit API response structures.
 */
export interface RedditChild {
  kind: string
  data: RedditPost
}

/**
 * Reddit API response structure.
 */
export interface RedditResponse {
  kind: string
  data: {
    after: string | null
    children: RedditChild[]
  }
}

/**
 * Subreddit information
 */
export interface RedditSubreddit {
  id?: string
  display_name: string
  icon_img?: string
  subscribers: number
  public_description?: string
  over18: boolean
}

/**
 * Reddit API search response structure.
 */
export interface RedditSearchResponse {
  data: {
    after: string
    children: Array<{
      data: RedditSubreddit
    }>
  }
}

/**
 * Reddit API OAuth response structure.
 */
export interface RedditOAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  error?: string
}
