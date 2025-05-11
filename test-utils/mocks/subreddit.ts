import type {PostResponse} from '@/lib/types/posts'

export const subredditMock: DeepPartial<PostResponse> = {
  kind: 'Listing',
  data: {
    after: 't3_1kjyhw7',
    dist: 4,
    modhash: '',
    geo_filter: null,
    children: [
      {
        kind: 't3',
        data: {
          approved_at_utc: null,
          subreddit: 'gifs',
          selftext: '',
          author_fullname: 't2_k50lh',
          saved: false,
          mod_reason_title: null,
          gilded: 0,
          clicked: false,
          title:
            'I drew this pixel art animation in memory of Peanut the Squirrel [OC]',
          link_flair_richtext: [],
          subreddit_name_prefixed: 'r/gifs',
          hidden: false,
          pwls: null,
          link_flair_css_class: null,
          downs: 0,
          thumbnail_height: 87,
          top_awarded_type: null,
          hide_score: false,
          name: 't3_1giw0we',
          quarantine: false,
          link_flair_text_color: 'dark',
          upvote_ratio: 0.94,
          author_flair_background_color: '#f000c4',
          subreddit_type: 'public',
          ups: 1775,
          total_awards_received: 0,
          media_embed: {},
          thumbnail_width: 140,
          author_flair_template_id: '8a612f18-fdc5-11ee-bf7b-0624632b8a6c',
          is_original_content: false,
          user_reports: [],
          secure_media: null,
          is_reddit_media_domain: true,
          is_meta: false,
          category: null,
          secure_media_embed: {},
          link_flair_text: null,
          can_mod_post: false,
          score: 1775,
          approved_by: null,
          is_created_from_ads_ui: false,
          author_premium: false,
          thumbnail:
            'https://b.thumbs.redditmedia.com/20wbNmUP1o5BQFm91MyenvPncFerCMbqQjhL33VCeQI.jpg',
          edited: false,
          author_flair_css_class: null,
          author_flair_richtext: [],
          gildings: {},
          post_hint: 'image',
          content_categories: null,
          is_self: false,
          mod_note: null,
          created: 1730664745.0,
          link_flair_type: 'text',
          wls: null,
          removed_by_category: null,
          banned_by: null,
          author_flair_type: 'text',
          domain: 'i.redd.it',
          allow_live_comments: false,
          selftext_html: null,
          likes: null,
          suggested_sort: null,
          banned_at_utc: null,
          url_overridden_by_dest: 'https://i.redd.it/5apc9mfquqyd1.gif',
          view_count: null,
          archived: false,
          no_follow: false,
          is_crosspostable: false,
          pinned: false,
          over_18: false,
          preview: {
            images: [
              {
                source: {
                  url: 'https://preview.redd.it/5apc9mfquqyd1.gif?format=png8&s=700b39e539a15a2c4817dad73d7c89513d07f27b',
                  width: 640,
                  height: 400
                },
                resolutions: [
                  {
                    url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=108&crop=smart&format=png8&s=3f6660435e886a82e9fb031201e8184b70a69f0a',
                    width: 108,
                    height: 67
                  },
                  {
                    url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=216&crop=smart&format=png8&s=301c7df41acfc78a703e990253336f6eabc3a0ca',
                    width: 216,
                    height: 135
                  },
                  {
                    url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=320&crop=smart&format=png8&s=1ce484b6b1da4d3cab791f7bf9b37814ace3a9bd',
                    width: 320,
                    height: 200
                  },
                  {
                    url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=640&crop=smart&format=png8&s=b02390e70a63c77872277c1b030070256078cb86',
                    width: 640,
                    height: 400
                  }
                ],
                variants: {
                  gif: {
                    source: {
                      url: 'https://preview.redd.it/5apc9mfquqyd1.gif?s=b75c7a8ebd16cd5a613cce8a92094377c4fd1131',
                      width: 640,
                      height: 400
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=108&crop=smart&s=c284c750e2ea3ca07e00c10936eb2a99ac1ba85b',
                        width: 108,
                        height: 67
                      },
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=216&crop=smart&s=48262443c039dba7759de16f1c3613a9ab497a1a',
                        width: 216,
                        height: 135
                      },
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=320&crop=smart&s=bed494cd8b83727f505a171b24336406ce8287e2',
                        width: 320,
                        height: 200
                      },
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=640&crop=smart&s=8f123b5068d573968dc9166ece3f16d749a1d74c',
                        width: 640,
                        height: 400
                      }
                    ]
                  },
                  mp4: {
                    source: {
                      url: 'https://preview.redd.it/5apc9mfquqyd1.gif?format=mp4&s=df6cf41e73b1589036fa531b5ab746c8036a0567',
                      width: 640,
                      height: 400
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=108&format=mp4&s=e43090ebe2211f007ccca032e3c7cebcc76cb09b',
                        width: 108,
                        height: 67
                      },
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=216&format=mp4&s=160b3df6501540bce01732699fd637bcca305c78',
                        width: 216,
                        height: 135
                      },
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=320&format=mp4&s=7521cf34f5d6f4cdae201f71cb28704280907709',
                        width: 320,
                        height: 200
                      },
                      {
                        url: 'https://preview.redd.it/5apc9mfquqyd1.gif?width=640&format=mp4&s=ed0f929510cbbc12a3d7edd2be914037900ce959',
                        width: 640,
                        height: 400
                      }
                    ]
                  }
                },
                id: 'w321e8sUDiIrcId4mSYR_nqh59THYoo-CfPdsVvceLA'
              }
            ],
            enabled: true
          },
          all_awardings: [],
          awarders: [],
          media_only: false,
          can_gild: false,
          spoiler: false,
          locked: false,
          author_flair_text: 'Arty Hardy',
          treatment_tags: [],
          visited: false,
          removed_by: null,
          num_reports: null,
          distinguished: null,
          subreddit_id: 't5_2qt55',
          author_is_blocked: false,
          mod_reason_by: null,
          removal_reason: null,
          link_flair_background_color: '',
          id: '1giw0we',
          is_robot_indexable: true,
          report_reasons: null,
          author: 'v78',
          discussion_type: null,
          num_comments: 23,
          send_replies: true,
          contest_mode: false,
          mod_reports: [],
          author_patreon_flair: false,
          author_flair_text_color: 'dark',
          permalink:
            '/r/gifs/comments/1giw0we/i_drew_this_pixel_art_animation_in_memory_of/',
          stickied: true,
          url: 'https://i.redd.it/5apc9mfquqyd1.gif',
          subreddit_subscribers: 21556883,
          created_utc: 1730664745.0,
          num_crossposts: 4,
          media: null,
          is_video: false
        }
      },
      {
        kind: 't3',
        data: {
          approved_at_utc: null,
          subreddit: 'gifs',
          selftext: '',
          author_fullname: 't2_a7bchoza',
          saved: false,
          mod_reason_title: null,
          gilded: 0,
          clicked: false,
          title:
            'New Block #48 (Migration Department, Part 2) in Floor796 [OC]',
          link_flair_richtext: [],
          subreddit_name_prefixed: 'r/gifs',
          hidden: false,
          pwls: null,
          link_flair_css_class: '',
          downs: 0,
          thumbnail_height: 105,
          top_awarded_type: null,
          hide_score: false,
          name: 't3_1gdaf62',
          quarantine: false,
          link_flair_text_color: null,
          upvote_ratio: 0.96,
          author_flair_background_color: '#b54a68',
          ups: 2792,
          total_awards_received: 0,
          media_embed: {},
          thumbnail_width: 140,
          author_flair_template_id: '647e1534-946c-11ef-adbf-4a623366476e',
          is_original_content: false,
          user_reports: [],
          secure_media: null,
          is_reddit_media_domain: true,
          is_meta: false,
          category: null,
          secure_media_embed: {},
          link_flair_text: 'Floored',
          can_mod_post: false,
          score: 2792,
          approved_by: null,
          is_created_from_ads_ui: false,
          author_premium: false,
          thumbnail:
            'https://a.thumbs.redditmedia.com/dnShNZ6EDasnSIxwOKcOcovSeAKn-RdzNWgjqZKCQ74.jpg',
          edited: false,
          author_flair_css_class: null,
          author_flair_richtext: [],
          gildings: {},
          post_hint: 'image',
          content_categories: null,
          is_self: false,
          subreddit_type: 'public',
          created: 1730034030.0,
          link_flair_type: 'text',
          wls: null,
          removed_by_category: null,
          banned_by: null,
          author_flair_type: 'text',
          domain: 'i.redd.it',
          allow_live_comments: false,
          selftext_html: null,
          likes: null,
          suggested_sort: null,
          banned_at_utc: null,
          url_overridden_by_dest: 'https://i.redd.it/1mcqc9i6raxd1.gif',
          view_count: null,
          archived: false,
          no_follow: false,
          is_crosspostable: false,
          pinned: false,
          over_18: false,
          preview: {
            images: [
              {
                source: {
                  url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?format=png8&s=64202380fc64bbcc29f119b2729c198938b9e628',
                  width: 1752,
                  height: 1314
                },
                resolutions: [
                  {
                    url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=108&crop=smart&format=png8&s=60bfd6fc8fb1e4fbdaa691fe817000f02c9033d7',
                    width: 108,
                    height: 81
                  },
                  {
                    url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=216&crop=smart&format=png8&s=b5571ad406e200f6e221c890d524c12c82517567',
                    width: 216,
                    height: 162
                  },
                  {
                    url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=320&crop=smart&format=png8&s=77d5cfd46dd60056998a82f4c26cb8631d30ddf3',
                    width: 320,
                    height: 240
                  },
                  {
                    url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=640&crop=smart&format=png8&s=894510cfed1ecd10106b2951c7bbc93b1ecc361b',
                    width: 640,
                    height: 480
                  },
                  {
                    url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=960&crop=smart&format=png8&s=5cf7ada62dcca486e79eb1b26190dccf568b6602',
                    width: 960,
                    height: 720
                  },
                  {
                    url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=1080&crop=smart&format=png8&s=1678796ebfae03ea1dd0baba6699e594f616d6e6',
                    width: 1080,
                    height: 810
                  }
                ],
                variants: {
                  gif: {
                    source: {
                      url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?s=d983c9ae9951242841b954f9da1a767de33e7fbb',
                      width: 1752,
                      height: 1314
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=108&crop=smart&s=4b3dfd8bac518af8e9f13156eb0d8a23e6a4d3b2',
                        width: 108,
                        height: 81
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=216&crop=smart&s=d552a804a03d7e02a21bc4367e316baf638dc571',
                        width: 216,
                        height: 162
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=320&crop=smart&s=6d5501f6aa4b95894e5906c981b11b73db2515a1',
                        width: 320,
                        height: 240
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=640&crop=smart&s=0b7816602fb819924ed8ef887a99b0726c5eb553',
                        width: 640,
                        height: 480
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=960&crop=smart&s=da5a14061a6c193e035bfdef15f84e9648620ec4',
                        width: 960,
                        height: 720
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=1080&crop=smart&s=d9255799ca3672b0098bb80535e9e6c7f804a025',
                        width: 1080,
                        height: 810
                      }
                    ]
                  },
                  mp4: {
                    source: {
                      url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?format=mp4&s=a8f1b8c678291eab450e43dab82adecb0c27cd4b',
                      width: 1752,
                      height: 1314
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=108&format=mp4&s=2ed742f22ee66123d109fe8ca47a41d9f38770b3',
                        width: 108,
                        height: 81
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=216&format=mp4&s=f5290b8391c965f581b067e41916c2bd79fdcf4c',
                        width: 216,
                        height: 162
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=320&format=mp4&s=88e4554c8216cbd7c8903bdd18a7550a1c399024',
                        width: 320,
                        height: 240
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=640&format=mp4&s=002b049feb33d9ec288273f09c50c88da9a16813',
                        width: 640,
                        height: 480
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=960&format=mp4&s=737b83989368ab16f4a7fb98f38c74f7d5cb1b70',
                        width: 960,
                        height: 720
                      },
                      {
                        url: 'https://preview.redd.it/1mcqc9i6raxd1.gif?width=1080&format=mp4&s=e7039e1a731cb83debe31f910114d49e94571816',
                        width: 1080,
                        height: 810
                      }
                    ]
                  }
                },
                id: '-GcZfNcjXLqpesaisgaVAtWLXXOD9HoAA25F3OTBj5w'
              }
            ],
            enabled: true
          },
          all_awardings: [],
          awarders: [],
          media_only: false,
          link_flair_template_id: 'f0e66e72-946c-11ef-8d70-cee4a7b1cc19',
          can_gild: false,
          spoiler: false,
          locked: false,
          author_flair_text: 'Floorguy 🏯',
          treatment_tags: [],
          visited: false,
          removed_by: null,
          mod_note: null,
          distinguished: null,
          subreddit_id: 't5_2qt55',
          author_is_blocked: false,
          mod_reason_by: null,
          num_reports: null,
          removal_reason: null,
          link_flair_background_color: '#996666',
          id: '1gdaf62',
          is_robot_indexable: true,
          report_reasons: null,
          author: 'floor796',
          discussion_type: null,
          num_comments: 60,
          send_replies: true,
          contest_mode: false,
          mod_reports: [],
          author_patreon_flair: false,
          author_flair_text_color: 'dark',
          permalink:
            '/r/gifs/comments/1gdaf62/new_block_48_migration_department_part_2_in/',
          stickied: true,
          url: 'https://i.redd.it/1mcqc9i6raxd1.gif',
          subreddit_subscribers: 21556883,
          created_utc: 1730034030.0,
          num_crossposts: 0,
          media: null,
          is_video: false
        }
      },
      {
        kind: 't3',
        data: {
          approved_at_utc: null,
          subreddit: 'gifs',
          selftext: '',
          author_fullname: 't2_1i9tomkivb',
          saved: false,
          mod_reason_title: null,
          gilded: 0,
          clicked: false,
          title: 'FUUUUCK YOU, HAHAHAH!',
          link_flair_richtext: [],
          subreddit_name_prefixed: 'r/gifs',
          hidden: false,
          pwls: null,
          link_flair_css_class: null,
          downs: 0,
          thumbnail_height: 74,
          top_awarded_type: null,
          hide_score: false,
          name: 't3_1kjqctq',
          quarantine: false,
          link_flair_text_color: 'dark',
          upvote_ratio: 0.9,
          author_flair_background_color: null,
          subreddit_type: 'public',
          ups: 1384,
          total_awards_received: 0,
          media_embed: {},
          thumbnail_width: 140,
          author_flair_template_id: null,
          is_original_content: false,
          user_reports: [],
          secure_media: null,
          is_reddit_media_domain: true,
          is_meta: false,
          category: null,
          secure_media_embed: {},
          link_flair_text: null,
          can_mod_post: false,
          score: 1384,
          approved_by: null,
          is_created_from_ads_ui: false,
          author_premium: false,
          thumbnail:
            'https://external-preview.redd.it/Ae2ktQy_n4MZXO0N84Vuyh8gHHhKtFJTT_PhYTt6XMI.gif?width=140&height=74&crop=140:74,smart&s=364760ed251f8b260ba2a69b937ef6f59caa038a',
          edited: false,
          author_flair_css_class: null,
          author_flair_richtext: [],
          gildings: {},
          post_hint: 'image',
          content_categories: null,
          is_self: false,
          mod_note: null,
          created: 1746929612.0,
          link_flair_type: 'text',
          wls: null,
          removed_by_category: null,
          banned_by: null,
          author_flair_type: 'text',
          domain: 'i.redd.it',
          allow_live_comments: false,
          selftext_html: null,
          likes: null,
          suggested_sort: null,
          banned_at_utc: null,
          url_overridden_by_dest: 'https://i.redd.it/s0bdd51na20f1.gif',
          view_count: null,
          archived: false,
          no_follow: false,
          is_crosspostable: false,
          pinned: false,
          over_18: false,
          preview: {
            images: [
              {
                source: {
                  url: 'https://preview.redd.it/s0bdd51na20f1.gif?format=png8&s=7fffa2279eb8c244cda491066eabb9865c2a23ce',
                  width: 400,
                  height: 214
                },
                resolutions: [
                  {
                    url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=108&crop=smart&format=png8&s=f3e2057850c31ee5c393ccee29f2be9feb029828',
                    width: 108,
                    height: 57
                  },
                  {
                    url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=216&crop=smart&format=png8&s=fb328a9e734c4f6ca6b45e1a31d75cbb9bbfa5cd',
                    width: 216,
                    height: 115
                  },
                  {
                    url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=320&crop=smart&format=png8&s=70810a56c6881f4e28f11f293ff6f8d75af7b4d4',
                    width: 320,
                    height: 171
                  }
                ],
                variants: {
                  gif: {
                    source: {
                      url: 'https://preview.redd.it/s0bdd51na20f1.gif?s=5092f1520793b17acfa2fefa69744e1177a2de7e',
                      width: 400,
                      height: 214
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=108&crop=smart&s=b810d9d173b033fd92577044bd58c3135677566a',
                        width: 108,
                        height: 57
                      },
                      {
                        url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=216&crop=smart&s=a5c1ff8e3400c46075e654db6d417516637759db',
                        width: 216,
                        height: 115
                      },
                      {
                        url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=320&crop=smart&s=5324250deec2af9f0b3e7ac5c629aa4ad5ac96a7',
                        width: 320,
                        height: 171
                      }
                    ]
                  },
                  mp4: {
                    source: {
                      url: 'https://preview.redd.it/s0bdd51na20f1.gif?format=mp4&s=fb3d3163969d492b7929089aa6a2e36c79998018',
                      width: 400,
                      height: 214
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=108&format=mp4&s=d938a38dee92396a2d1b60512525965039434c96',
                        width: 108,
                        height: 57
                      },
                      {
                        url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=216&format=mp4&s=87412e4079e4947d0ac94f91ddaa76714b53eeab',
                        width: 216,
                        height: 115
                      },
                      {
                        url: 'https://preview.redd.it/s0bdd51na20f1.gif?width=320&format=mp4&s=f15daf03ff255c016abe31550726cafacd3681ab',
                        width: 320,
                        height: 171
                      }
                    ]
                  }
                },
                id: 'Ae2ktQy_n4MZXO0N84Vuyh8gHHhKtFJTT_PhYTt6XMI'
              }
            ],
            enabled: true
          },
          all_awardings: [],
          awarders: [],
          media_only: false,
          can_gild: false,
          spoiler: false,
          locked: false,
          author_flair_text: null,
          treatment_tags: [],
          visited: false,
          removed_by: null,
          num_reports: null,
          distinguished: null,
          subreddit_id: 't5_2qt55',
          author_is_blocked: false,
          mod_reason_by: null,
          removal_reason: null,
          link_flair_background_color: '',
          id: '1kjqctq',
          is_robot_indexable: true,
          report_reasons: null,
          author: 'GastropodSoups',
          discussion_type: null,
          num_comments: 98,
          send_replies: true,
          contest_mode: false,
          mod_reports: [],
          author_patreon_flair: false,
          author_flair_text_color: null,
          permalink: '/r/gifs/comments/1kjqctq/fuuuuck_you_hahahah/',
          stickied: false,
          url: 'https://i.redd.it/s0bdd51na20f1.gif',
          subreddit_subscribers: 21556883,
          created_utc: 1746929612.0,
          num_crossposts: 0,
          media: null,
          is_video: false
        }
      },
      {
        kind: 't3',
        data: {
          approved_at_utc: null,
          subreddit: 'gifs',
          selftext: '',
          author_fullname: 't2_4eqhs',
          saved: false,
          mod_reason_title: null,
          gilded: 0,
          clicked: false,
          title: 'Riding in the car! Weeee!',
          link_flair_richtext: [],
          subreddit_name_prefixed: 'r/gifs',
          hidden: false,
          pwls: null,
          link_flair_css_class: null,
          downs: 0,
          thumbnail_height: 140,
          top_awarded_type: null,
          hide_score: false,
          name: 't3_1kjyhw7',
          quarantine: false,
          link_flair_text_color: 'dark',
          upvote_ratio: 0.86,
          author_flair_background_color: null,
          subreddit_type: 'public',
          ups: 237,
          total_awards_received: 0,
          media_embed: {},
          thumbnail_width: 140,
          author_flair_template_id: null,
          is_original_content: false,
          user_reports: [],
          secure_media: null,
          is_reddit_media_domain: true,
          is_meta: false,
          category: null,
          secure_media_embed: {},
          link_flair_text: null,
          can_mod_post: false,
          score: 237,
          approved_by: null,
          is_created_from_ads_ui: false,
          author_premium: true,
          thumbnail:
            'https://external-preview.redd.it/Dbz3SG6baOg8Ykr5m5iBKbQ2lIiVzRY76twSQvCGyOo.gif?width=140&height=140&crop=140:140,smart&s=bc29e7fe17bd1dc7cf87c8418880f4c77c1c56ff',
          edited: false,
          author_flair_css_class: null,
          author_flair_richtext: [],
          gildings: {},
          post_hint: 'image',
          content_categories: null,
          is_self: false,
          mod_note: null,
          created: 1746961517.0,
          link_flair_type: 'text',
          wls: null,
          removed_by_category: null,
          banned_by: null,
          author_flair_type: 'text',
          domain: 'i.redd.it',
          allow_live_comments: false,
          selftext_html: null,
          likes: null,
          suggested_sort: null,
          banned_at_utc: null,
          url_overridden_by_dest: 'https://i.redd.it/h6euli9ix40f1.gif',
          view_count: null,
          archived: false,
          no_follow: false,
          is_crosspostable: false,
          pinned: false,
          over_18: false,
          preview: {
            images: [
              {
                source: {
                  url: 'https://preview.redd.it/h6euli9ix40f1.gif?format=png8&s=1db56f66f0db0fa71324e1d41b2d25522fa0561c',
                  width: 576,
                  height: 1024
                },
                resolutions: [
                  {
                    url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=108&crop=smart&format=png8&s=c9fe2a82178c9c4438352cd80547e63d1eafe8a9',
                    width: 108,
                    height: 192
                  },
                  {
                    url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=216&crop=smart&format=png8&s=cd504712d378c300e356fd7d2c3209432dead7e7',
                    width: 216,
                    height: 384
                  },
                  {
                    url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=320&crop=smart&format=png8&s=0ed38f05833d9a3fdd6b31e7520025c089954c8b',
                    width: 320,
                    height: 568
                  }
                ],
                variants: {
                  gif: {
                    source: {
                      url: 'https://preview.redd.it/h6euli9ix40f1.gif?s=121c963dc59c29554fd9c0b691fd44ed42900698',
                      width: 576,
                      height: 1024
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=108&crop=smart&s=dd400725e7b0ea0f2e707efe11b97197e031010d',
                        width: 108,
                        height: 192
                      },
                      {
                        url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=216&crop=smart&s=16a68211f8349068ac5de5db1b2b39545ae5911b',
                        width: 216,
                        height: 384
                      },
                      {
                        url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=320&crop=smart&s=1d0ef1a78720da0227ba57b3abcca69e4132b58f',
                        width: 320,
                        height: 568
                      }
                    ]
                  },
                  mp4: {
                    source: {
                      url: 'https://preview.redd.it/h6euli9ix40f1.gif?format=mp4&s=e01e2a2633fe3f295b348ca309bef0688af4c1fd',
                      width: 576,
                      height: 1024
                    },
                    resolutions: [
                      {
                        url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=108&format=mp4&s=90f62b68ee1fd97b4c1b3e4d67a9e833d22b59fc',
                        width: 108,
                        height: 192
                      },
                      {
                        url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=216&format=mp4&s=74bfeae2c2a8ed3ddc70d28916702b3e9e35c850',
                        width: 216,
                        height: 384
                      },
                      {
                        url: 'https://preview.redd.it/h6euli9ix40f1.gif?width=320&format=mp4&s=beab34e0d3a9c1e669c28b27373d98eb0e64d376',
                        width: 320,
                        height: 568
                      }
                    ]
                  }
                },
                id: 'Dbz3SG6baOg8Ykr5m5iBKbQ2lIiVzRY76twSQvCGyOo'
              }
            ],
            enabled: true
          },
          all_awardings: [],
          awarders: [],
          media_only: false,
          can_gild: false,
          spoiler: false,
          locked: false,
          author_flair_text: null,
          treatment_tags: [],
          visited: false,
          removed_by: null,
          num_reports: null,
          distinguished: null,
          subreddit_id: 't5_2qt55',
          author_is_blocked: false,
          mod_reason_by: null,
          removal_reason: null,
          link_flair_background_color: '',
          id: '1kjyhw7',
          is_robot_indexable: true,
          report_reasons: null,
          author: 'lnfinity',
          discussion_type: null,
          num_comments: 7,
          send_replies: false,
          contest_mode: false,
          mod_reports: [],
          author_patreon_flair: false,
          author_flair_text_color: null,
          permalink: '/r/gifs/comments/1kjyhw7/riding_in_the_car_weeee/',
          stickied: false,
          url: 'https://i.redd.it/h6euli9ix40f1.gif',
          subreddit_subscribers: 21556883,
          created_utc: 1746961517.0,
          num_crossposts: 0,
          media: null,
          is_video: false
        }
      }
    ],
    before: null
  }
}
