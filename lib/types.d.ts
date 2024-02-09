export interface RedditTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
  error?: string
}

export interface RedditSearchResponse {
  data?: {
    after: string | null
    before: string | null
    children: {
      data: {
        display_name: string
        id: string
        over18: boolean
        url: string
      }
    }[]
    dist?: number
    geo_filter?: string
    modhash?: string
  }
  error?: string
}

export interface RedditPostResponse {
  kind?: string
  data?: {
    modhash: string
    dist: number
    children: {
      kind: string
      data: RedditPost
    }[]
    after: string
    before: string
  }
  error?: string
}

export interface RedditPost {
  index: number
  id: string
  preview: {
    images: {
      source: ImageAsset
      resolutions: ImageAsset[]
      variants: {
        obfuscated: {
          source: ImageAsset
          resolutions: ImageAsset[]
        }
        nsfw: {
          source: ImageAsset
          resolutions: ImageAsset[]
        }
      }
    }[]
    reddit_video_preview: {
      dash_url: string
      fallback_url: string
      height: number
      scrubber_media_url: string
      hls_url: string
      width: number
      is_gif: boolean
    }
  }
  media: {
    type: string
    reddit_video: {
      dash_url: string
      fallback_url: string
      height: number
      scrubber_media_url: string
      hls_url: string
      width: number
    }
    oembed: {
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
  over_18: boolean
  permalink: string
  post_hint: string
  poststickied: boolean
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

export interface ImageAsset {
  url: string
  width: number
  height: number
}

export interface FetchSubredditProps {
  slug: string
  sortBy: string
  limit: number | string
  after: string
}

export interface PageProps {
  params: {slug: string}
  searchParams: {before: string; after: string; limit: number; sortBy: string}
}

export interface HlsPlayerProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'data-hint'> {
  dataHint?: string
}
