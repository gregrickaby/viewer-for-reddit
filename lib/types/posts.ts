export interface PostResponse {
  kind?: string
  data?: PostResponseData
}

export interface PostResponseData {
  after?: string
  dist?: number
  modhash?: string
  geo_filter?: null
  children?: PostChild[]
  before?: null
}

export interface PostChild {
  kind?: string
  data?: PostChildData
}

export interface PostChildData {
  approved_at_utc?: null
  subreddit?: string
  selftext?: string
  user_reports?: any[]
  saved?: boolean
  mod_reason_title?: null
  gilded?: number
  clicked?: boolean
  title?: string
  link_flair_richtext?: any[]
  subreddit_name_prefixed?: string
  hidden?: boolean
  pwls?: null
  link_flair_css_class?: string | null
  downs?: number
  thumbnail_height?: number | null
  top_awarded_type?: null
  hide_score?: boolean
  name?: string
  quarantine?: boolean
  link_flair_text_color?: string | null
  upvote_ratio?: number
  author_flair_background_color?: string | null
  subreddit_type?: string
  ups?: number
  total_awards_received?: number
  media_embed?: MediaEmbed
  thumbnail_width?: number | null
  author_flair_template_id?: string | null
  is_original_content?: boolean
  author_fullname?: string
  secure_media?: Media | null
  is_reddit_media_domain?: boolean
  is_meta?: boolean
  category?: null
  secure_media_embed?: SecureMediaEmbed
  link_flair_text?: string | null
  link_flair_template_id?: string | null
  can_mod_post?: boolean
  score?: number
  approved_by?: null
  is_created_from_ads_ui?: boolean
  author_premium?: boolean
  thumbnail?: string
  edited?: boolean
  author_flair_css_class?: null
  author_flair_richtext?: any[]
  gildings?: Gildings
  content_categories?: null
  is_self?: boolean
  mod_note?: null
  crosspost_parent_list?: CrosspostParentList[]
  created?: number
  link_flair_type?: string
  wls?: null
  removed_by_category?: null
  banned_by?: null
  author_flair_type?: string
  domain?: string
  allow_live_comments?: boolean
  selftext_html?: null
  likes?: null
  suggested_sort?: null
  banned_at_utc?: null
  url_overridden_by_dest?: string
  view_count?: null
  archived?: boolean
  no_follow?: boolean
  is_crosspostable?: boolean
  pinned?: boolean
  over_18?: boolean
  all_awardings?: any[]
  awarders?: any[]
  media_only?: boolean
  can_gild?: boolean
  spoiler?: boolean
  locked?: boolean
  author_flair_text?: string | null
  treatment_tags?: any[]
  visited?: boolean
  removed_by?: null
  num_reports?: null
  distinguished?: null
  subreddit_id?: string
  author_is_blocked?: boolean
  mod_reason_by?: null
  removal_reason?: null
  link_flair_background_color?: string
  id?: string
  is_robot_indexable?: boolean
  report_reasons?: null
  author?: string
  discussion_type?: null
  num_comments?: number
  send_replies?: boolean
  contest_mode?: boolean
  mod_reports?: any[]
  author_patreon_flair?: boolean
  crosspost_parent?: string
  author_flair_text_color?: string | null
  permalink?: string
  stickied?: boolean
  url?: string
  subreddit_subscribers?: number
  created_utc?: number
  num_crossposts?: number
  media?: Media | null
  is_video?: boolean
  post_hint?: string
  preview?: Preview
}

export interface CrosspostParentList {
  approved_at_utc?: null
  subreddit?: string
  selftext?: string
  author_fullname?: string
  saved?: boolean
  mod_reason_title?: null
  gilded?: number
  clicked?: boolean
  title?: string
  link_flair_richtext?: any[]
  subreddit_name_prefixed?: string
  hidden?: boolean
  pwls?: null
  link_flair_css_class?: string | null
  downs?: number
  thumbnail_height?: null
  top_awarded_type?: null
  hide_score?: boolean
  name?: string
  quarantine?: boolean
  link_flair_text_color?: string
  upvote_ratio?: number
  author_flair_background_color?: null
  subreddit_type?: string
  ups?: number
  total_awards_received?: number
  media_embed?: Gildings
  thumbnail_width?: null
  author_flair_template_id?: null
  is_original_content?: boolean
  user_reports?: any[]
  secure_media?: null
  is_reddit_media_domain?: boolean
  is_meta?: boolean
  category?: null
  secure_media_embed?: Gildings
  link_flair_text?: null
  can_mod_post?: boolean
  score?: number
  approved_by?: null
  is_created_from_ads_ui?: boolean
  author_premium?: boolean
  thumbnail?: string
  edited?: number
  author_flair_css_class?: null
  author_flair_richtext?: any[]
  gildings?: Gildings
  content_categories?: null
  is_self?: boolean
  mod_note?: null
  created?: number
  link_flair_type?: string
  wls?: null
  removed_by_category?: string
  banned_by?: null
  author_flair_type?: string
  domain?: string
  allow_live_comments?: boolean
  selftext_html?: string
  likes?: null
  suggested_sort?: null
  banned_at_utc?: null
  view_count?: null
  archived?: boolean
  no_follow?: boolean
  is_crosspostable?: boolean
  pinned?: boolean
  over_18?: boolean
  all_awardings?: any[]
  awarders?: any[]
  media_only?: boolean
  can_gild?: boolean
  spoiler?: boolean
  locked?: boolean
  author_flair_text?: null
  treatment_tags?: any[]
  visited?: boolean
  removed_by?: null
  num_reports?: null
  distinguished?: string
  subreddit_id?: string
  author_is_blocked?: boolean
  mod_reason_by?: null
  removal_reason?: null
  link_flair_background_color?: string
  id?: string
  is_robot_indexable?: boolean
  report_reasons?: null
  author?: string
  discussion_type?: null
  num_comments?: number
  send_replies?: boolean
  contest_mode?: boolean
  mod_reports?: any[]
  author_patreon_flair?: boolean
  author_flair_text_color?: null
  permalink?: string
  stickied?: boolean
  url?: string
  subreddit_subscribers?: number
  created_utc?: number
  num_crossposts?: number
  media?: null
  is_video?: boolean
}

export interface Gildings {}

export interface Media {
  type?: string
  oembed?: Oembed
}

export interface Oembed {
  provider_url?: string
  version?: string
  title?: string
  thumbnail_width?: number
  height?: number
  width?: number
  html?: string
  provider_name?: string
  thumbnail_url?: string
  type?: string
  thumbnail_height?: number
}

export interface MediaEmbed {
  content?: string
  width?: number
  scrolling?: boolean
  height?: number
}

export interface Preview {
  images?: Image[]
  reddit_video_preview?: RedditVideoPreview
  enabled?: boolean
}

export interface Image {
  source?: Source
  resolutions?: Source[]
  variants?: Variants
  id?: string
}

export interface Source {
  url?: string
  width?: number
  height?: number
}

export interface Variants {
  obfuscated?: MediaData
  nsfw?: MediaData
  gif?: MediaData
  mp4?: MediaData
}

export interface MediaData {
  source?: Source
  resolutions?: Source[]
}

export interface RedditVideoPreview {
  bitrate_kbps?: number
  fallback_url?: string
  height?: number
  width?: number
  scrubber_media_url?: string
  dash_url?: string
  duration?: number
  hls_url?: string
  is_gif?: boolean
  transcoding_status?: string
}

export interface SecureMediaEmbed {
  content?: string
  width?: number
  scrolling?: boolean
  media_domain_url?: string
  height?: number
}
