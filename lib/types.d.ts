/** Global types only. */

export interface ChildrenProps {
  children: React.ReactNode
}

export interface RedditProviderProps {
  autoPlay: boolean
  blurNSFW: boolean
  searchInput: string
  setAutoplay: (autoPlay: boolean) => void
  setBlurNSFW: (blurNSFW: boolean) => void
  setSearchInput: (searchInput: string) => void
  setSort: (sort: string) => void
  setSubreddit: (subReddit: {}) => void
  sort: string
  subReddit: any
}

export interface FetchPostsProps {
  lastPost: string | null
  limit?: number
  sort?: string
  subReddit: string
}

export interface ImageAsset {
  url: string
  width: number
  height: number
}

export interface Post {
  index: number
  id: string
  images: {
    original: ImageAsset
    cropped: ImageAsset
    obfuscated: ImageAsset
  }
  media: {
    reddit_video: {
      dash_url: string
      fallback_url: string
      height: number
      scrubber_media_url: string
      hls_url: string
      width: number
    }
  }
  over_18: boolean
  permalink: string
  post_hint: string
  score: number
  subreddit: string
  thumbnail: string
  secure_media_embed: {
    content: string
    height: number
    media_domain_url: string
    scrolling: boolean
    width: number
  }
  video_preview: {
    dash_url: string
    fallback_url: string
    height: number
    scrubber_media_url: string
    hls_url: string
    width: number
  }
  title: string
  url: string
}

export interface Posts {
  after: string
  posts: Post[]
}
