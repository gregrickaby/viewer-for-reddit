/** Global types only. */

export interface ChildrenProps {
  children: React.ReactNode
}

export interface FetchPostsProps {
  lastPost: string | null
  limit?: number
  sort?: string
  subReddit: string
}

export interface Post {
  id: string
  images: {
    height: number
    url: string
    width: number
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
