import type { ImageSet, MultiView, PostView, SafeHtml, SubredditView } from '@/lib/view-models'

/* Small view-model builders for component tests. */

export const html = (value: string) => value as SafeHtml

export function imageSet(overrides: Partial<ImageSet> = {}): ImageSet {
  return {
    src: 'https://i.redd.it/a.jpg',
    srcSet: 'https://preview.redd.it/a.jpg?width=320 320w, https://i.redd.it/a.jpg 640w',
    width: 640,
    height: 480,
    blurred: null,
    ...overrides,
  }
}

export const blurred = {
  src: 'https://preview.redd.it/blur.jpg',
  srcSet: 'https://preview.redd.it/blur.jpg 640w',
}

export function postView(overrides: Partial<PostView> = {}): PostView {
  return {
    id: 'abc',
    fullname: 't3_abc',
    subreddit: 'pics',
    author: 'spez',
    title: 'A post',
    permalink: '/r/pics/comments/abc/a_post',
    createdUtc: 1_700_000_000,
    editedUtc: null,
    score: 1234,
    hideScore: false,
    likes: 0,
    numComments: 12,
    saved: false,
    flags: { nsfw: false, spoiler: false, stickied: false, locked: false, archived: false },
    distinguished: null,
    removal: null,
    flair: null,
    body: null,
    media: { type: 'none' },
    crosspostFrom: null,
    suggestedSort: null,
    ...overrides,
  }
}

export function subredditView(overrides: Partial<SubredditView> = {}): SubredditView {
  return {
    name: 'pics',
    fullname: 't5_2qh0u',
    title: 'Reddit Pics',
    href: '/r/pics',
    kind: 'community',
    description: html('<p>Pictures</p>'),
    subscribers: 33_500_000,
    icon: 'https://styles.redditmedia.com/icon.png',
    banner: 'https://styles.redditmedia.com/banner.png',
    color: '#553200',
    nsfw: false,
    quarantined: false,
    subscribed: true,
    favorited: false,
    ...overrides,
  }
}

export function multiView(overrides: Partial<MultiView> = {}): MultiView {
  return {
    name: 'news',
    displayName: 'News',
    owner: 'spez',
    href: '/m/news',
    visibility: 'private',
    description: null,
    descriptionMd: '',
    subreddits: ['news', 'worldnews'],
    canEdit: true,
    icon: 'https://www.redditstatic.com/custom_feeds/custom_feed_default_4.png',
    nsfw: false,
    ...overrides,
  }
}
