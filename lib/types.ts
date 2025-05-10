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
 * User settings persisted in localStorage.
 */
export interface UserSettings {
  currentSort: SortingOption // Current post sorting method
  currentSubreddit: string | null // Currently selected subreddit
  enableNsfw: boolean // NSFW content toggle
  favorites: RedditSubreddit[] // Favorite subreddits
  isMuted: boolean // Mute audio in video posts
  recent: RedditSubreddit[] // Recently visited subreddits
}

/**
 * Base asset interface for images and videos.
 */
export interface Asset {
  width?: number
  height?: number
}

/**
 * Image asset with URL.
 */
export interface ImageAsset extends Asset {
  url: string
}

/**
 * Video asset with streaming URLs.
 */
export interface VideoAsset extends Asset {
  bitrate_kbps: number
  fallback_url: string
  height: number
  width: number
  scrubber_media_url: string
  dash_url: string
  duration: number
  hls_url: string
  is_gif: boolean
  transcoding_status: string
  has_audio: boolean
}

/**
 * Media preview for galleries.
 */
export interface RedditMediaPreview extends Asset {
  u?: string
  x?: number
  y?: number
}

/**
 * Source media for galleries.
 */
export interface RedditMediaSource extends Asset {
  u?: string
  gif?: string
  y?: number
  x?: number
}

/**
 * Gallery item metadata.
 */
export interface RedditMediaMetadataItem {
  e: string
  id: string
  m: string
  o?: RedditMediaSource[]
  p: RedditMediaPreview[]
  s?: RedditMediaSource
  status: 'valid' | 'failed'
}

export type RedditMediaMetadata = Record<string, RedditMediaMetadataItem>

/**
 * Gallery data structure.
 */
export interface RedditGalleryItem {
  caption?: string
  media_id: string
  id: number
}

/**
 * Gallery data structure.
 */
export interface RedditGalleryData {
  items: RedditGalleryItem[]
}

/**
 * Embedded media content.
 */
export interface RedditOEmbed extends Asset {
  provider_name: string
  provider_url: string
  title: string
  html: string
  thumbnail_height: number
  thumbnail_width: number
  thumbnail_url: string
  type: string
  version: string
}

/**
 * Embedded media content.
 */
export interface RedditMediaEmbed extends Asset {
  content?: string
  media_domain_url?: string
  scrolling?: boolean
}

/**
 * Image preview with variants.
 */
export interface RedditImagePreview {
  id?: string
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

export type LinkFlairRichText = Array<
  | {
      e: 'emoji'
      a: string
      u: string
    }
  | {
      e: 'text'
      t: string
    }
>

export interface CrosspostParent {
  approved_at_utc: number | null
  subreddit: string
  selftext: string
  author_fullname: string
  saved: boolean
  mod_reason_title: string | null
  gilded: number
  clicked: boolean
  title: string
  link_flair_richtext: LinkFlairRichText
  subreddit_name_prefixed: string
  hidden: boolean
  pwls: number | null
  link_flair_css_class: string | null
  downs: number
  thumbnail_height?: number | null
  top_awarded_type: string | null
  hide_score: boolean
  name: string
  quarantine: boolean
  link_flair_text_color: 'dark' | 'light' | string
  upvote_ratio: number
  author_flair_background_color: string | null
  subreddit_type: 'public' | 'private' | 'restricted' | string
  ups: number
  total_awards_received: number
  media_embed: Record<string, unknown>
  thumbnail_width?: number | null
  author_flair_template_id: string | null
  is_original_content: boolean
  user_reports: any[]
  secure_media: any | null
  is_reddit_media_domain: boolean
  is_meta: boolean
  category: string | null
  secure_media_embed: Record<string, unknown>
  link_flair_text: string | null
  can_mod_post: boolean
  score: number
  approved_by: string | null
  is_created_from_ads_ui: boolean
  author_premium: boolean
  thumbnail: string
  edited: boolean | number
  author_flair_css_class: string | null
  author_flair_richtext: any[]
  gildings: Record<string, number>
  content_categories: string[] | null
  is_self: boolean
  mod_note: string | null
  created: number
  link_flair_type: 'text' | 'richtext' | string
  wls: number | null
  removed_by_category: string | null
  banned_by: string | null
  author_flair_type: 'text' | 'richtext'
  domain: string
  allow_live_comments: boolean
  selftext_html: string | null
  likes: boolean | null
  suggested_sort: string | null
  banned_at_utc: number | null
  view_count: number | null
  archived: boolean
  no_follow: boolean
  is_crosspostable: boolean
  pinned: boolean
  over_18: boolean
  all_awardings: any[]
  awarders: any[]
  media_only: boolean
  can_gild: boolean
  spoiler: boolean
  locked: boolean
  author_flair_text: string | null
  treatment_tags: any[]
  visited: boolean
  removed_by: string | null
  num_reports: number | null
  distinguished: 'moderator' | 'admin' | 'special' | string | null
  subreddit_id: string
  author_is_blocked: boolean
  mod_reason_by: string | null
  removal_reason: string | null
  link_flair_background_color: string
  id: string
  is_robot_indexable: boolean
  report_reasons: string[] | null
  author: string
  discussion_type: string | null
  num_comments: number
  send_replies: boolean
  contest_mode: boolean
  mod_reports: any[]
  author_patreon_flair: boolean
  author_flair_text_color: string | null
  permalink: string
  stickied: boolean
  url: string
  subreddit_subscribers: number
  created_utc: number
  num_crossposts: number
  media: any | null
  is_video: boolean
}

/**
 * Core post data.
 */
export interface RedditPost {
  id: string
  name: string
  title: string
  author: string
  author_fullname: string
  subreddit: string
  subreddit_id: string
  subreddit_name_prefixed: string
  subreddit_subscribers: number
  subreddit_type: 'public' | 'private' | 'restricted' | string

  permalink: string
  url: string
  url_overridden_by_dest?: string | null
  domain: string

  is_self: boolean
  is_gallery?: boolean
  selftext?: string
  selftext_html: string | null
  post_hint?:
    | 'image'
    | 'hosted:video'
    | 'rich:video'
    | 'link'
    | 'self'
    | 'gallery'
    | string
  preview?: {
    images: RedditImagePreview[]
    reddit_video_preview?: VideoAsset
    enabled?: boolean
  }

  media?: {
    reddit_video?: VideoAsset
    oembed?: RedditOEmbed
    type?: string
  } | null

  secure_media?: {
    reddit_video?: VideoAsset
  } | null

  media_embed?: RedditMediaEmbed
  secure_media_embed?: RedditMediaEmbed
  video_preview?: VideoAsset
  media_metadata?: RedditMediaMetadata

  is_video: boolean
  is_reddit_media_domain: boolean
  is_crosspostable: boolean
  is_meta: boolean
  is_original_content: boolean
  is_created_from_ads_ui: boolean

  over_18: boolean
  spoiler: boolean
  locked: boolean
  pinned: boolean
  stickied: boolean
  archived: boolean
  hidden: boolean
  visited: boolean
  clicked: boolean
  saved: boolean

  ups: number
  downs: number
  score: number
  upvote_ratio: number
  likes: boolean | null
  num_comments: number
  num_crossposts: number
  view_count: number | null
  submit_text_html?: string | null
  restrict_posting?: boolean

  created: number
  created_utc: number

  author_is_blocked: boolean
  author_premium: boolean
  author_flair_background_color: string | null
  author_flair_text: string | null
  author_flair_text_color: string | null
  author_flair_css_class: string | null
  author_flair_template_id: string | null
  author_flair_richtext: LinkFlairRichText
  author_flair_type: 'text' | 'richtext'
  author_patreon_flair?: boolean
  user_flair_background_color?: string | null

  distinguished: 'moderator' | 'admin' | 'special' | string | null

  quarantine: boolean
  allow_live_comments: boolean
  can_mod_post: boolean
  contest_mode: boolean
  send_replies: boolean

  approved_at_utc: number | null
  approved_by: string | null
  banned_by: string | null
  banned_at_utc: number | null
  removed_by: string | null
  removed_by_category: string | null
  mod_reason_by: string | null
  mod_reason_title: string | null
  mod_note: string | null
  mod_reports: unknown[]
  user_reports: unknown[]
  user_is_banned?: boolean | null
  free_form_reports?: boolean
  wiki_enabled?: boolean
  num_reports: number | null

  edited: boolean | number
  gilded: number
  gildings: Record<string, number>
  total_awards_received: number
  all_awardings: unknown[]
  awarders: unknown[]

  thumbnail?: string
  thumbnail_width?: number | null
  thumbnail_height?: number | null

  link_flair_type: 'text' | 'richtext' | string
  link_flair_text: string | null
  link_flair_text_color: 'dark' | 'light' | string | null
  link_flair_css_class: string | null
  link_flair_template_id?: string | null
  link_flair_richtext: LinkFlairRichText
  link_flair_background_color: string | null

  content_categories: string[] | null
  category: string | null
  suggested_sort: string | null
  discussion_type: string | null

  report_reasons: string[] | string | null
  no_follow: boolean
  is_robot_indexable: boolean

  treatment_tags: unknown[]
  pwls?: number | null
  wls?: number | null
  top_awarded_type: string | null
  hide_score: boolean
  media_only?: boolean
  can_gild?: boolean
  removal_reason?: string | null
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
 * Reddit API OAuth response structure.
 */
export interface OAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  error?: string
}

export interface PopularListingResponse {
  kind: string
  data: PopularListingData
}

export interface PopularListingData {
  after: string
  dist: number
  modhash: string
  geo_filter: string
  children: PopularSubredditChild[]
  before: string | null
}

export interface PopularSubredditChild {
  kind: string
  data: PopularSubredditData
}

export interface PopularSubredditData {
  user_flair_background_color?: null
  submit_text_html?: null | string
  restrict_posting?: boolean
  user_is_banned?: null
  free_form_reports?: boolean
  wiki_enabled?: boolean
  user_is_muted?: null
  user_can_flair_in_sr?: null
  display_name?: string
  header_img?: null | string
  title?: string
  allow_galleries?: boolean
  icon_size?: number[] | null
  primary_color?: string
  active_user_count?: null
  icon_img?: string
  display_name_prefixed?: string
  accounts_active?: null
  public_traffic?: boolean
  subscribers?: number
  user_flair_richtext?: any[]
  videostream_links_count?: number
  name?: string
  quarantine?: boolean
  hide_ads?: boolean
  prediction_leaderboard_entry_type?: number
  emojis_enabled?: boolean
  advertiser_category?: string
  public_description?: string
  comment_score_hide_mins?: number
  allow_predictions?: boolean
  user_has_favorited?: null
  user_flair_template_id?: null
  community_icon?: string
  banner_background_image?: string
  original_content_tag_enabled?: boolean
  community_reviewed?: boolean
  submit_text?: string
  description_html?: string
  spoilers_enabled?: boolean
  comment_contribution_settings?: CommentContributionSettings
  allow_talks?: boolean
  header_size?: number[] | null
  user_flair_position?: string
  all_original_content?: boolean
  has_menu_widget?: boolean
  is_enrolled_in_new_modmail?: null
  key_color?: string
  can_assign_user_flair?: boolean
  created?: number
  wls?: number
  show_media_preview?: boolean
  submission_type?: string
  user_is_subscriber?: null
  allowed_media_in_comments?: any[]
  allow_videogifs?: boolean
  should_archive_posts?: boolean
  user_flair_type?: string
  allow_polls?: boolean
  collapse_deleted_comments?: boolean
  emojis_custom_size?: null
  public_description_html?: null | string
  allow_videos?: boolean
  is_crosspostable_subreddit?: boolean
  suggested_comment_sort?: null
  should_show_media_in_comments_setting?: boolean
  can_assign_link_flair?: boolean
  accounts_active_is_fuzzed?: boolean
  allow_prediction_contributors?: boolean
  submit_text_label?: string
  link_flair_position?: string
  user_sr_flair_enabled?: null
  user_flair_enabled_in_sr?: boolean
  allow_discovery?: boolean
  accept_followers?: boolean
  user_sr_theme_enabled?: boolean
  link_flair_enabled?: boolean
  disable_contributor_requests?: boolean
  subreddit_type?: string
  notification_level?: null
  banner_img?: string
  user_flair_text?: null
  banner_background_color?: string
  show_media?: boolean
  id?: string
  user_is_contributor?: null
  over18?: boolean
  header_title?: string
  description?: string
  submit_link_label?: string
  user_flair_text_color?: null
  restrict_commenting?: boolean
  user_flair_css_class?: null
  allow_images?: boolean
  lang?: string
  url?: string
  created_utc?: number
  banner_size?: number[] | null
  mobile_banner_image?: string
  user_is_moderator?: null
  allow_predictions_tournament?: boolean
}

export interface SearchResponse {
  kind?: string
  data?: SearchResponseData
}

export interface SearchResponseData {
  after?: null
  dist?: number
  modhash?: string
  geo_filter?: string
  children?: SearchChild[]
  before?: null
}

export interface SearchChild {
  kind?: string
  data?: SearchResult
}

export interface SearchResult {
  user_flair_background_color?: null
  submit_text_html?: null | string
  restrict_posting?: boolean
  user_is_banned?: null
  free_form_reports?: boolean
  wiki_enabled?: boolean
  user_is_muted?: null
  user_can_flair_in_sr?: null
  display_name?: string
  header_img?: null | string
  title?: string
  allow_galleries?: boolean
  icon_size?: number[] | null
  primary_color?: string
  active_user_count?: null
  icon_img?: string
  display_name_prefixed?: string
  accounts_active?: null
  public_traffic?: boolean
  subscribers?: number
  user_flair_richtext?: any[]
  videostream_links_count?: number
  name?: string
  quarantine?: boolean
  hide_ads?: boolean
  prediction_leaderboard_entry_type?: number
  emojis_enabled?: boolean
  advertiser_category?: string
  public_description?: string
  comment_score_hide_mins?: number
  allow_predictions?: boolean
  user_has_favorited?: null
  user_flair_template_id?: null
  community_icon?: string
  banner_background_image?: string
  original_content_tag_enabled?: boolean
  community_reviewed?: boolean
  submit_text?: string
  description_html?: string
  spoilers_enabled?: boolean
  comment_contribution_settings?: CommentContributionSettings
  allow_talks?: boolean
  header_size?: number[] | null
  user_flair_position?: string
  all_original_content?: boolean
  has_menu_widget?: boolean
  is_enrolled_in_new_modmail?: null
  key_color?: string
  can_assign_user_flair?: boolean
  created?: number
  wls?: number
  show_media_preview?: boolean
  submission_type?: string
  user_is_subscriber?: null
  allowed_media_in_comments?: string[]
  allow_videogifs?: boolean
  should_archive_posts?: boolean
  user_flair_type?: string
  allow_polls?: boolean
  collapse_deleted_comments?: boolean
  emojis_custom_size?: null
  public_description_html?: string
  allow_videos?: boolean
  is_crosspostable_subreddit?: boolean
  notification_level?: null | string
  should_show_media_in_comments_setting?: boolean
  can_assign_link_flair?: boolean
  accounts_active_is_fuzzed?: boolean
  allow_prediction_contributors?: boolean
  submit_text_label?: string
  link_flair_position?: string
  user_sr_flair_enabled?: null
  user_flair_enabled_in_sr?: boolean
  allow_discovery?: boolean
  accept_followers?: boolean
  user_sr_theme_enabled?: boolean
  link_flair_enabled?: boolean
  disable_contributor_requests?: boolean
  subreddit_type?: string
  suggested_comment_sort?: null | string
  banner_img?: string
  user_flair_text?: null
  content_category?: string
  banner_background_color?: string
  show_media?: boolean
  id?: string
  user_is_moderator?: null
  over18?: boolean
  header_title?: string
  description?: string
  submit_link_label?: string
  user_flair_text_color?: null
  restrict_commenting?: boolean
  user_flair_css_class?: null
  allow_images?: boolean
  lang?: string
  url?: string
  created_utc?: number
  banner_size?: number[] | null
  mobile_banner_image?: string
  user_is_contributor?: null
  allow_predictions_tournament?: boolean
}

export interface CommentContributionSettings {
  allowed_media_types?: string[] | null
}
