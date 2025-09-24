/**
 * Mock data for user profile endpoint (/user/{username}/about.json)
 */
export const userProfileMock = {
  kind: 't2',
  data: {
    id: '2cf0dc',
    name: 'testuser',
    created: 1234567890.0,
    created_utc: 1234567890.0,
    link_karma: 12345,
    comment_karma: 67890,
    total_karma: 80235,
    is_employee: false,
    is_friend: false,
    is_moderator: false,
    is_gold: false,
    is_mod: false,
    has_verified_email: true,
    icon_img:
      'https://styles.redditmedia.com/t5_abcde/styles/profileIcon_default.jpg',
    verified: true,
    subreddit: {
      default_set: true,
      user_is_contributor: null,
      banner_img: null,
      restrict_posting: true,
      user_is_banned: null,
      free_form_reports: true,
      community_icon: null,
      show_media: true,
      icon_color: null,
      user_is_muted: null,
      display_name: 'u_testuser',
      header_img: null,
      title: '',
      coins: 0,
      previous_names: [],
      over_18: false,
      icon_size: [256, 256],
      primary_color: null,
      icon_img:
        'https://styles.redditmedia.com/t5_abcde/styles/profileIcon_default.jpg',
      description: 'Test user profile description',
      allowed_media_in_comments: [],
      submit_link_label: '',
      header_size: null,
      restrict_commenting: false,
      subscribers: 1,
      submit_text_label: '',
      is_default_icon: true,
      link_flair_position: '',
      display_name_prefixed: 'u/testuser',
      key_color: null,
      name: 't5_abcde',
      is_default_banner: true,
      url: '/user/testuser/',
      quarantine: false,
      banner_size: null,
      user_is_moderator: null,
      accept_followers: true,
      public_description: 'A test user for mocking',
      link_flair_enabled: false,
      disable_contributor_requests: false,
      subreddit_type: 'user',
      user_is_subscriber: null
    }
  }
}

/**
 * Mock data for user that doesn't exist
 */
export const userNotFoundMock = {
  message: 'Not Found',
  error: 404
}
