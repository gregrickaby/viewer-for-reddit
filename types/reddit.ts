/**
 * Base asset interface for images and videos.
 */
interface Asset {
  width?: number
  height?: number
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
  u?: string
  x?: number
  y?: number
}

/**
 * Source media for galleries.
 */
interface RedditMediaSource extends Asset {
  u?: string
  gif?: string
  y?: number
  x?: number
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
  content?: string
  media_domain_url?: string
  scrolling?: boolean
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
  approved_at_utc: number | null
  author_fullname: string
  saved: boolean
  mod_reason_title: string | null
  gilded: number
  clicked: boolean
  link_flair_richtext: Array<{e: string; t: string}>
  hidden: boolean
  pwls: number
  link_flair_css_class: string | null
  downs: number
  thumbnail_height: number | null
  top_awarded_type: string | null
  hide_score: boolean
  name: string
  quarantine: boolean
  link_flair_text_color: string | null
  upvote_ratio: number
  author_flair_background_color: string | null
  total_awards_received: number
  created_utc: number
  score: number
  ups: number
  num_comments: number
  stickied: boolean
  post_hint?: 'image' | 'hosted:video' | 'rich:video' | 'link'
  over_18: boolean
  is_video: boolean
  link_flair_template_id?: string | null
  index?: number
  selftext?: string
  author_flair_template_id: string | null
  is_original_content: boolean
  user_reports: Array<unknown>
  secure_media: unknown
  is_reddit_media_domain: boolean
  is_meta: boolean
  category: string | null
  link_flair_text: string | null
  can_mod_post: boolean
  approved_by: string | null
  is_created_from_ads_ui: boolean
  author_premium: boolean
  edited: boolean
  author_flair_css_class: string | null
  author_flair_richtext: Array<{e: string; t: string}>
  gildings: Record<string, number>
  content_categories: string | null
  is_self: boolean
  subreddit_type: string
  created: number
  link_flair_type: string
  wls: number
  removed_by_category: string | null
  banned_by: string | null
  author_flair_type: string
  domain: string
  allow_live_comments: boolean
  selftext_html: string | null
  likes: string | null
  suggested_sort: string | null
  banned_at_utc: number | null
  url_overridden_by_dest?: string | null
  view_count: number | null
  archived: boolean
  no_follow: boolean
  is_crosspostable: boolean
  pinned: boolean
  all_awardings: Array<unknown>
  awarders: Array<unknown>
  media_only: boolean
  can_gild: boolean
  spoiler: boolean
  locked: boolean
  author_flair_text: string | null
  treatment_tags: Array<unknown>
  visited: boolean
  removed_by: string | null
  mod_note: string | null
  distinguished: string | null
  subreddit_id: string
  author_is_blocked: boolean
  mod_reason_by: string | null
  num_reports: number | null
  removal_reason: string | null
  link_flair_background_color: string | null
  is_robot_indexable: boolean
  report_reasons: string | null
  discussion_type: string | null
  send_replies: boolean
  contest_mode: boolean
  mod_reports: Array<unknown>
  author_patreon_flair: boolean
  author_flair_text_color: string | null
  num_crossposts: number

  // Media content.
  preview?: {
    images: RedditImagePreview[]
    reddit_video_preview?: VideoAsset
  }
  media?: {
    type?: string
    reddit_video?: VideoAsset
    oembed?: RedditOEmbed
  } | null
  secure_media_embed?: RedditMediaEmbed
  video_preview?: VideoAsset
  thumbnail?: string
  media_embed?: RedditMediaEmbed
  thumbnail_width: number | null

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
    before: string | null
    dist: number
    modhash: string | null
    geo_filter: string | null
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

export interface PopularListing {
  kind: string
  data: PopularListingData
}

export interface PopularListingData {
  after: string
  dist: number
  modhash: string
  geo_filter: string
  children: RedditChild[]
  before: string | null
}

export interface PopularSubredditChild {
  kind: string
  data: PopularSubredditData
}

export interface PopularSubredditData {
  user_flair_background_color: string | null
  submit_text_html: string | null
  restrict_posting: boolean
  user_is_banned: boolean | null
  free_form_reports: boolean
  wiki_enabled: boolean
  user_is_muted: boolean | null
  user_can_flair_in_sr: boolean | null
  display_name: string
  header_img: string | null
  title: string
  allow_galleries: boolean
  icon_size: [number, number] | null
  primary_color: string
  active_user_count: number | null
  icon_img: string
  display_name_prefixed: string
  accounts_active: number | null
  public_traffic: boolean
  subscribers: number
  user_flair_richtext: Array<{e: string; t: string}>
  videostream_links_count?: number
  name: string
  quarantine: boolean
  hide_ads: boolean
  prediction_leaderboard_entry_type: number
  emojis_enabled: boolean
  advertiser_category: string
  public_description: string
  comment_score_hide_mins: number
  allow_predictions: boolean
  user_has_favorited: boolean | null
  user_flair_template_id: string | null
  community_icon: string
  banner_background_image: string
  original_content_tag_enabled: boolean
  community_reviewed: boolean
  submit_text: string
  description_html: string | null
  spoilers_enabled: boolean
  comment_contribution_settings: {
    allowed_media_types: string[] | null
  }
  allow_talks: boolean
  header_size: [number, number] | null
  user_flair_position: 'left' | 'right'
  all_original_content: boolean
  has_menu_widget: boolean
  is_enrolled_in_new_modmail: boolean | null
  key_color: string
  can_assign_user_flair: boolean
  created: number
  wls: number
  show_media_preview: boolean
  submission_type: 'any' | 'self' | string
  user_is_subscriber: boolean | null
  allowed_media_in_comments: string[]
  allow_videogifs: boolean
  should_archive_posts: boolean
  user_flair_type: 'text' | 'richtext' | string
  allow_polls: boolean
  collapse_deleted_comments: boolean
  emojis_custom_size: [number, number] | null
  public_description_html: string | null
  allow_videos: boolean
  is_crosspostable_subreddit: boolean
  suggested_comment_sort: string | null
  should_show_media_in_comments_setting: boolean
  can_assign_link_flair: boolean
  accounts_active_is_fuzzed: boolean
  allow_prediction_contributors: boolean
  submit_text_label: string
  link_flair_position: 'left' | 'right'
  user_sr_flair_enabled: boolean | null
  user_flair_enabled_in_sr: boolean
  allow_discovery: boolean
  accept_followers: boolean
  user_sr_theme_enabled: boolean
  link_flair_enabled: boolean
  disable_contributor_requests: boolean
  subreddit_type: 'public' | 'private' | 'restricted'
  notification_level: number | null
  banner_img: string
  user_flair_text: string | null
  banner_background_color: string
  show_media: boolean
  id: string
  user_is_contributor: boolean | null
  over18: boolean
  header_title: string
  description: string
  submit_link_label: string
  user_flair_text_color: string | null
  restrict_commenting: boolean
  user_flair_css_class: string | null
  allow_images: boolean
  lang: string
  url: string
  created_utc: number
  banner_size: [number, number] | null
  mobile_banner_image: string
  user_is_moderator: boolean | null
  allow_predictions_tournament: boolean
}
