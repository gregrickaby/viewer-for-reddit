import { RedditResponse } from '@/types/reddit'

/**
 * Mock response from the Reddit API for a subreddit.
 *
 * This includes 2 posts from the "aww" subreddit.
 */
export const mockSubredditResponse: RedditResponse = {
  kind: 'Listing',
  data: {
    after: 't3_1iug7f3',
    dist: 2,
    modhash: '',
    geo_filter: null,
    children: [
      {
        kind: 't3',
        data: {
          approved_at_utc: null,
          subreddit: 'aww',
          selftext: '',
          author_fullname: 't2_149fd2xwei',
          saved: false,
          mod_reason_title: null,
          gilded: 0,
          clicked: false,
          is_gallery: true,
          title: "I can't look at this without smiling",
          link_flair_richtext: [],
          subreddit_name_prefixed: 'r/aww',
          hidden: false,
          pwls: 6,
          link_flair_css_class: 'lc',
          downs: 0,
          thumbnail_height: 105,
          top_awarded_type: null,
          hide_score: false,
          media_metadata: {
            jjpegfmxhike1: {
              status: 'valid',
              e: 'Image',
              m: 'image/jpg',
              p: [
                {
                  y: 81,
                  x: 108,
                  u: 'https://preview.redd.it/jjpegfmxhike1.jpg?width=108\u0026crop=smart\u0026auto=webp\u0026s=dc21a86086979dfb9c99da87e8aa3ed2fce5d9ac'
                },
                {
                  y: 162,
                  x: 216,
                  u: 'https://preview.redd.it/jjpegfmxhike1.jpg?width=216\u0026crop=smart\u0026auto=webp\u0026s=f5ec79ad9c32bb093d4a5b74e5746e5b9baaab1f'
                },
                {
                  y: 240,
                  x: 320,
                  u: 'https://preview.redd.it/jjpegfmxhike1.jpg?width=320\u0026crop=smart\u0026auto=webp\u0026s=32fefdfd6ddae05e60afda48029d8d860d24ba1b'
                },
                {
                  y: 480,
                  x: 640,
                  u: 'https://preview.redd.it/jjpegfmxhike1.jpg?width=640\u0026crop=smart\u0026auto=webp\u0026s=f474ffecf624c52bbebe53ccab5960f6ae8221f6'
                },
                {
                  y: 720,
                  x: 960,
                  u: 'https://preview.redd.it/jjpegfmxhike1.jpg?width=960\u0026crop=smart\u0026auto=webp\u0026s=7ff6dc91aaaac91e9610ecb57d271e7b67a89ed7'
                },
                {
                  y: 810,
                  x: 1080,
                  u: 'https://preview.redd.it/jjpegfmxhike1.jpg?width=1080\u0026crop=smart\u0026auto=webp\u0026s=c2011a94ccc7debb46949aa4086dffae5720b35f'
                }
              ],
              s: {
                y: 960,
                x: 1280,
                u: 'https://preview.redd.it/jjpegfmxhike1.jpg?width=1280\u0026format=pjpg\u0026auto=webp\u0026s=ddc9e6714988fb6d3f0d0504464d7217b9c64fcd'
              },
              id: 'jjpegfmxhike1'
            },
            fi76mfmxhike1: {
              status: 'valid',
              e: 'Image',
              m: 'image/jpg',
              p: [
                {
                  y: 81,
                  x: 108,
                  u: 'https://preview.redd.it/fi76mfmxhike1.jpg?width=108\u0026crop=smart\u0026auto=webp\u0026s=2b0bab87e2e53874de4452d1f653113d2d8035d3'
                },
                {
                  y: 162,
                  x: 216,
                  u: 'https://preview.redd.it/fi76mfmxhike1.jpg?width=216\u0026crop=smart\u0026auto=webp\u0026s=8ee2b4cd3522654fa00125918cb84e45275fc639'
                },
                {
                  y: 240,
                  x: 320,
                  u: 'https://preview.redd.it/fi76mfmxhike1.jpg?width=320\u0026crop=smart\u0026auto=webp\u0026s=a5a9aea2f4820d640dd7805c5cd27b99b7ac93df'
                },
                {
                  y: 480,
                  x: 640,
                  u: 'https://preview.redd.it/fi76mfmxhike1.jpg?width=640\u0026crop=smart\u0026auto=webp\u0026s=b9fa4497b0bf698bed6d7c2e64afb000f57c08d6'
                },
                {
                  y: 720,
                  x: 960,
                  u: 'https://preview.redd.it/fi76mfmxhike1.jpg?width=960\u0026crop=smart\u0026auto=webp\u0026s=0f595e2c3fdfd8d706c3b3c67f78c25a33c6127c'
                },
                {
                  y: 810,
                  x: 1080,
                  u: 'https://preview.redd.it/fi76mfmxhike1.jpg?width=1080\u0026crop=smart\u0026auto=webp\u0026s=c5809405b90d1e33d0147345905e5bb5c4d5aacc'
                }
              ],
              s: {
                y: 960,
                x: 1280,
                u: 'https://preview.redd.it/fi76mfmxhike1.jpg?width=1280\u0026format=pjpg\u0026auto=webp\u0026s=975525df8b64d88222ab5d06ab4741a617f5e844'
              },
              id: 'fi76mfmxhike1'
            },
            '69suafmxhike1': {
              status: 'valid',
              e: 'Image',
              m: 'image/jpg',
              p: [
                {
                  y: 144,
                  x: 108,
                  u: 'https://preview.redd.it/69suafmxhike1.jpg?width=108\u0026crop=smart\u0026auto=webp\u0026s=6a1b31c6ba2699c9d944155c741a8fbcd62d4aed'
                },
                {
                  y: 288,
                  x: 216,
                  u: 'https://preview.redd.it/69suafmxhike1.jpg?width=216\u0026crop=smart\u0026auto=webp\u0026s=7bda8494d2ce34e4be2bbb9597554c7a348d9cac'
                },
                {
                  y: 426,
                  x: 320,
                  u: 'https://preview.redd.it/69suafmxhike1.jpg?width=320\u0026crop=smart\u0026auto=webp\u0026s=62c1b69da3e711157b1091509ad6778cfe9d7337'
                },
                {
                  y: 853,
                  x: 640,
                  u: 'https://preview.redd.it/69suafmxhike1.jpg?width=640\u0026crop=smart\u0026auto=webp\u0026s=3ddebe9d6e5d9413a3df173db4493d954a81edde'
                },
                {
                  y: 1280,
                  x: 960,
                  u: 'https://preview.redd.it/69suafmxhike1.jpg?width=960\u0026crop=smart\u0026auto=webp\u0026s=12ff5912c9a2f55fc66ef6a12088e9d42dba0937'
                }
              ],
              s: {
                y: 1280,
                x: 960,
                u: 'https://preview.redd.it/69suafmxhike1.jpg?width=960\u0026format=pjpg\u0026auto=webp\u0026s=a33d7ddc46e34445b4681ccd2477903908cac28c'
              },
              id: '69suafmxhike1'
            }
          },
          name: 't3_1iutq1p',
          quarantine: false,
          link_flair_text_color: null,
          upvote_ratio: 0.98,
          author_flair_background_color: null,
          ups: 1457,
          total_awards_received: 0,
          media_embed: {},
          thumbnail_width: 140,
          author_flair_template_id: null,
          is_original_content: true,
          user_reports: [],
          secure_media: null,
          is_reddit_media_domain: false,
          is_meta: false,
          category: null,
          secure_media_embed: {},
          gallery_data: {
            items: [
              { media_id: 'fi76mfmxhike1', id: 609673935 },
              { media_id: 'jjpegfmxhike1', id: 609673936 },
              { media_id: '69suafmxhike1', id: 609673937 }
            ]
          },
          link_flair_text: null,
          can_mod_post: false,
          score: 1457,
          approved_by: null,
          is_created_from_ads_ui: false,
          author_premium: false,
          thumbnail:
            'https://b.thumbs.redditmedia.com/mBiJnBZIn44mlJm6_ouFPVM4yi6I79uLGNe5NLLETOc.jpg',
          edited: false,
          author_flair_css_class: null,
          author_flair_richtext: [],
          gildings: {},
          content_categories: null,
          is_self: false,
          subreddit_type: 'public',
          created: 1740152245.0,
          link_flair_type: 'text',
          wls: 6,
          removed_by_category: null,
          banned_by: null,
          author_flair_type: 'text',
          domain: 'reddit.com',
          allow_live_comments: false,
          selftext_html: null,
          likes: null,
          suggested_sort: null,
          banned_at_utc: null,
          url_overridden_by_dest: 'https://www.reddit.com/gallery/1iutq1p',
          view_count: null,
          archived: false,
          no_follow: false,
          is_crosspostable: false,
          pinned: false,
          over_18: false,
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
          mod_note: null,
          distinguished: null,
          subreddit_id: 't5_2qh1o',
          author_is_blocked: false,
          mod_reason_by: null,
          num_reports: null,
          removal_reason: null,
          link_flair_background_color: null,
          id: '1iutq1p',
          is_robot_indexable: true,
          report_reasons: null,
          author: 'Plane-Sandwich4955',
          discussion_type: null,
          num_comments: 40,
          send_replies: true,
          contest_mode: false,
          mod_reports: [],
          author_patreon_flair: false,
          author_flair_text_color: null,
          permalink:
            '/r/aww/comments/1iutq1p/i_cant_look_at_this_without_smiling/',
          stickied: false,
          url: 'https://www.reddit.com/gallery/1iutq1p',
          subreddit_subscribers: 37593852,
          created_utc: 1740152245.0,
          num_crossposts: 1,
          media: null,
          is_video: false
        }
      },
      {
        kind: 't3',
        data: {
          approved_at_utc: null,
          subreddit: 'aww',
          selftext: '',
          author_fullname: 't2_62267zt',
          saved: false,
          mod_reason_title: null,
          gilded: 0,
          clicked: false,
          is_gallery: true,
          title: 'Im a shelter vet tech and had to share my friend Kevin',
          link_flair_richtext: [],
          subreddit_name_prefixed: 'r/aww',
          hidden: false,
          pwls: 6,
          link_flair_css_class: null,
          downs: 0,
          thumbnail_height: 140,
          top_awarded_type: null,
          hide_score: false,
          media_metadata: {
            uvicjhqjleke1: {
              status: 'valid',
              e: 'Image',
              m: 'image/jpg',
              p: [
                {
                  y: 144,
                  x: 108,
                  u: 'https://preview.redd.it/uvicjhqjleke1.jpg?width=108\u0026crop=smart\u0026auto=webp\u0026s=e53b500b0dc1450a3d61df94b37e4cc2afc96686'
                },
                {
                  y: 288,
                  x: 216,
                  u: 'https://preview.redd.it/uvicjhqjleke1.jpg?width=216\u0026crop=smart\u0026auto=webp\u0026s=b96479a6fa43b9ba15c6cd6abe2664e56113ac86'
                },
                {
                  y: 426,
                  x: 320,
                  u: 'https://preview.redd.it/uvicjhqjleke1.jpg?width=320\u0026crop=smart\u0026auto=webp\u0026s=112b35a460389b0e7fd0d256d67ae3d269feec71'
                },
                {
                  y: 853,
                  x: 640,
                  u: 'https://preview.redd.it/uvicjhqjleke1.jpg?width=640\u0026crop=smart\u0026auto=webp\u0026s=57444ccc38d49a8b6b36440c9c8efebd8c1d6151'
                },
                {
                  y: 1280,
                  x: 960,
                  u: 'https://preview.redd.it/uvicjhqjleke1.jpg?width=960\u0026crop=smart\u0026auto=webp\u0026s=bf78224632431ffa80e2b55c1769c9220ec7d653'
                },
                {
                  y: 1440,
                  x: 1080,
                  u: 'https://preview.redd.it/uvicjhqjleke1.jpg?width=1080\u0026crop=smart\u0026auto=webp\u0026s=1943a146166433ba2d80acbb4eaebaed316db02e'
                }
              ],
              s: {
                y: 5072,
                x: 3804,
                u: 'https://preview.redd.it/uvicjhqjleke1.jpg?width=3804\u0026format=pjpg\u0026auto=webp\u0026s=72dbf8d3c5643accfc5c228555be774a08d9881c'
              },
              id: 'uvicjhqjleke1'
            },
            r9zv8iqjleke1: {
              status: 'valid',
              e: 'Image',
              m: 'image/jpg',
              p: [
                {
                  y: 144,
                  x: 108,
                  u: 'https://preview.redd.it/r9zv8iqjleke1.jpg?width=108\u0026crop=smart\u0026auto=webp\u0026s=4a4be5c988abd5ec1bca68d14242af9fae31f2d9'
                },
                {
                  y: 288,
                  x: 216,
                  u: 'https://preview.redd.it/r9zv8iqjleke1.jpg?width=216\u0026crop=smart\u0026auto=webp\u0026s=fee6c7d939c7dddd07827f05508aaea806f7147d'
                },
                {
                  y: 426,
                  x: 320,
                  u: 'https://preview.redd.it/r9zv8iqjleke1.jpg?width=320\u0026crop=smart\u0026auto=webp\u0026s=a8bed032465b66156507fb5146bf63aafec81fbc'
                },
                {
                  y: 853,
                  x: 640,
                  u: 'https://preview.redd.it/r9zv8iqjleke1.jpg?width=640\u0026crop=smart\u0026auto=webp\u0026s=18eb088fcc16b10b957a7f972c70ae4d22065f8f'
                },
                {
                  y: 1280,
                  x: 960,
                  u: 'https://preview.redd.it/r9zv8iqjleke1.jpg?width=960\u0026crop=smart\u0026auto=webp\u0026s=8fa5620aae3d6472bdf0788e859714a5e1753f99'
                },
                {
                  y: 1440,
                  x: 1080,
                  u: 'https://preview.redd.it/r9zv8iqjleke1.jpg?width=1080\u0026crop=smart\u0026auto=webp\u0026s=bca056c388496fca12b9cd35520a790ded91180b'
                }
              ],
              s: {
                y: 4900,
                x: 3675,
                u: 'https://preview.redd.it/r9zv8iqjleke1.jpg?width=3675\u0026format=pjpg\u0026auto=webp\u0026s=303e944d54420dadb2f5ac151537f48795b1e39e'
              },
              id: 'r9zv8iqjleke1'
            }
          },
          name: 't3_1iug7f3',
          quarantine: false,
          link_flair_text_color: 'dark',
          upvote_ratio: 0.97,
          author_flair_background_color: '',
          ups: 22129,
          total_awards_received: 0,
          media_embed: {},
          thumbnail_width: 140,
          author_flair_template_id: null,
          is_original_content: true,
          user_reports: [],
          secure_media: null,
          is_reddit_media_domain: false,
          is_meta: false,
          category: null,
          secure_media_embed: {},
          gallery_data: {
            items: [
              { media_id: 'r9zv8iqjleke1', id: 609388397 },
              { media_id: 'uvicjhqjleke1', id: 609388398 }
            ]
          },
          link_flair_text: null,
          can_mod_post: false,
          score: 22129,
          approved_by: null,
          is_created_from_ads_ui: false,
          author_premium: false,
          thumbnail:
            'https://b.thumbs.redditmedia.com/kzBtymjfawslcEGrZOqA7u-XJtM0JGZj89Q4AZ44nqM.jpg',
          edited: false,
          author_flair_css_class: '',
          author_flair_richtext: [],
          gildings: {},
          content_categories: null,
          is_self: false,
          subreddit_type: 'public',
          created: 1740105001.0,
          link_flair_type: 'text',
          wls: 6,
          removed_by_category: null,
          banned_by: null,
          author_flair_type: 'text',
          domain: 'reddit.com',
          allow_live_comments: false,
          selftext_html: null,
          likes: null,
          suggested_sort: null,
          banned_at_utc: null,
          url_overridden_by_dest: 'https://www.reddit.com/gallery/1iug7f3',
          view_count: null,
          archived: false,
          no_follow: false,
          is_crosspostable: false,
          pinned: false,
          over_18: false,
          all_awardings: [],
          awarders: [],
          media_only: false,
          can_gild: false,
          spoiler: false,
          locked: false,
          author_flair_text: '',
          treatment_tags: [],
          visited: false,
          removed_by: null,
          mod_note: null,
          distinguished: null,
          subreddit_id: 't5_2qh1o',
          author_is_blocked: false,
          mod_reason_by: null,
          num_reports: null,
          removal_reason: null,
          link_flair_background_color: '',
          id: '1iug7f3',
          is_robot_indexable: true,
          report_reasons: null,
          author: 'MegaNymphia',
          discussion_type: null,
          num_comments: 169,
          send_replies: true,
          contest_mode: false,
          mod_reports: [],
          author_patreon_flair: false,
          author_flair_text_color: '',
          permalink:
            '/r/aww/comments/1iug7f3/im_a_shelter_vet_tech_and_had_to_share_my_friend/',
          stickied: false,
          url: 'https://www.reddit.com/gallery/1iug7f3',
          subreddit_subscribers: 37593852,
          created_utc: 1740105001.0,
          num_crossposts: 2,
          media: null,
          is_video: false
        }
      }
    ],
    before: null
  }
}
