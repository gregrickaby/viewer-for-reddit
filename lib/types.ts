export interface ImageAsset {
  url: string
  width: number
  height: number
}

export interface VideoPreview {
  dash_url: string
  fallback_url: string
  height: number
  scrubber_media_url: string
  hls_url: string
  width: number
}

export interface RedditListing<T> {
  kind?: string
  data?: {
    after: string | null
    before: string | null
    dist?: number
    modhash?: string
    geo_filter?: string
    children: Array<{
      kind?: string
      data: T
    }>
  }
  error?: string
}

export interface RedditTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
  error?: string
}

export type RedditSearchResponse = RedditListing<{
  display_name: string
  id: string
  over18: boolean
  url: string
}>

export interface RedditPost {
  index: number
  id: string
  is_self: boolean
  preview?: {
    images: {
      source: ImageAsset
      resolutions: ImageAsset[]
      variants?: {
        obfuscated?: {
          source: ImageAsset
          resolutions: ImageAsset[]
        }
        nsfw?: {
          source: ImageAsset
          resolutions: ImageAsset[]
        }
      }
    }[]
    reddit_video_preview?: VideoPreview & {is_gif: boolean}
  }
  media?: {
    type?: string
    reddit_video?: VideoPreview
    oembed?: {
      provider_name: string
      provider_url: string
      title: string
      height: number
      width: number
      html: string
      thumbnail_height: number
      thumbnail_width: number
      thumbnail_url: string
      type: string
    }
  }
  selftext: string
  selftext_html: string
  author: string
  over_18: boolean
  permalink: string
  post_hint?: string
  poststickied?: boolean
  score: number
  subreddit: string
  thumbnail: string
  created_utc: number
  num_comments: number
  subreddit_name_prefixed: string
  secure_media_embed?: {
    content: string
    height: number
    media_domain_url: string
    scrolling: boolean
    width: number
  }
  video_preview?: VideoPreview
  title: string
  url: string
}

export type RedditPostResponse = RedditListing<RedditPost>

export interface RedditAboutResponse {
  kind?: string
  data?: {
    accounts_active: number
    community_icon: string
    created_utc: number
    display_name: string
    header_img: string
    icon_img: string
    over18: boolean
    public_description: string
    subscribers: number
    title: string
    url: string
  }
  error?: string
}

export type RedditPopularResponse = RedditListing<PopularSubredditData>

export interface PopularSubredditData {
  id: string
  name: string
  title: string
  display_name: string
  display_name_prefixed: string
  url: string
  description: string
  description_html: string
  public_description: string
  public_description_html: string | null
  submit_text: string
  submit_text_html: string | null
  submit_text_label: string
  submit_link_label: string
  header_title: string
  header_img: string | null
  banner_img: string
  banner_background_color: string
  banner_background_image: string
  mobile_banner_image: string
  icon_img: string
  icon_size: [number, number] | null
  community_icon: string
  primary_color: string
  key_color: string
  lang: string
  over18: boolean
  quarantine: boolean
  hide_ads: boolean
  restrict_posting: boolean
  restrict_commenting: boolean
  wiki_enabled: boolean
  allow_images: boolean
  allow_videos: boolean
  allow_galleries: boolean
  allow_polls: boolean
  allow_predictions: boolean
  allow_predictions_tournament: boolean
  allow_talks: boolean
  allow_discovery: boolean
  is_crosspostable_subreddit: boolean
  link_flair_enabled: boolean
  link_flair_position: 'left' | 'right'
  user_flair_enabled_in_sr: boolean
  user_flair_position: 'left' | 'right'
  user_flair_type: 'text' | 'richtext'
  can_assign_link_flair: boolean
  can_assign_user_flair: boolean
  show_media_preview: boolean
  show_media: boolean
  should_show_media_in_comments_setting: boolean
  emojis_enabled: boolean
  emojis_custom_size: [number, number] | null
  comment_score_hide_mins: number
  comment_contribution_settings: {
    allowed_media_types: string[] | null
  }
  collapse_deleted_comments: boolean
  submission_type: string
  notification_level: number | null
  suggested_comment_sort: string | null
  advertiser_category: string
  prediction_leaderboard_entry_type: number
  accounts_active: number | null
  accounts_active_is_fuzzed: boolean
  active_user_count: number | null
  subscribers: number
  community_reviewed: boolean
  original_content_tag_enabled: boolean
  all_original_content: boolean
  should_archive_posts: boolean
  user_sr_theme_enabled: boolean
  user_sr_flair_enabled: boolean | null
  user_is_subscriber: boolean | null
  user_is_moderator: boolean | null
  user_is_contributor: boolean | null
  user_flair_background_color: string | null
  user_flair_text: string | null
  user_flair_text_color: string | null
  user_flair_css_class: string | null
  user_flair_richtext: any[]
  user_flair_template_id: string | null
  user_has_favorited: boolean | null
  user_is_banned: boolean | null
  user_is_muted: boolean | null
  user_can_flair_in_sr: boolean | null
  has_menu_widget: boolean
  is_enrolled_in_new_modmail: boolean | null
  created: number
  created_utc: number
  accept_followers: boolean
  disable_contributor_requests: boolean
  wls: number
}

export interface FetchSubredditProps {
  slug: string
  sort: string
  limit: number
  after: string
}

export interface PageProps {
  params: Promise<{slug: string}>
  searchParams: Promise<{
    before: string
    after: string
    limit: number
    sort: string
  }>
}

export interface AboutProps {
  about: RedditAboutResponse
}

export interface HlsPlayerProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'data-hint'> {
  dataHint?: string
  src?: string
  fallbackUrl?: string
}
