export interface PopularResponse {
  kind?: string
  data?: PopularResponseData
}

export interface PopularResponseData {
  after?: string
  dist?: number
  modhash?: string
  geo_filter?: string
  children?: PopularChild[]
  before?: null
}

export interface PopularChild {
  kind?: string
  data?: PopularChildData
}

export interface PopularChildData {
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
  comment_contribution_settings?: {
    allowed_media_types?: null
  }
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
