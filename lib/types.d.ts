export interface ChildrenProps {
  children: React.ReactNode
}

export interface GetPostsProps {
  lastPost?: string | null
  limit?: number
  sortBy?: string
  subReddit?: string
}

export interface RedditAPIResponse {
  kind: string
  data: {
    modhash: string
    dist: number
    children: RedditPost[]
    after: string
    before: string
  }
}

export interface RedditPost {
  kind: string
  data: {
    [key: string]: any
  }
}

export interface FetchPostsProps {
  lastPost: string | null
  limit?: number
  sort?: string
  subReddit: string
}

export interface Post {
  index: number
  id: string
  images: {
    original: {
      height: number
      url: string
      width: number
    }
    cropped: {
      height: number
      url: string
      width: number
    }
    obfuscated: {
      height: number
      url: string
      width: number
    }
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
