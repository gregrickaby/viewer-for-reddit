import type {PostChildData} from '@/lib/types/posts'
import {useMemo} from 'react'

export function useMediaType(post: Readonly<PostChildData>) {
  const isImage = post.post_hint === 'image'
  const isLink = post.post_hint === 'link'
  const isRedditVideo =
    post.post_hint === 'hosted:video' || post.post_hint === 'rich:video'

  const isYouTube = post.media?.oembed?.provider_name === 'YouTube'
  const youtubeVideoId = useMemo(() => {
    if (!isYouTube) return null
    return (
      /embed\/([a-zA-Z0-9_-]+)/.exec(post.media?.oembed?.html ?? '')?.[1] ??
      null
    )
  }, [isYouTube, post.media?.oembed])

  return {
    isImage,
    isLink,
    isRedditVideo,
    isYouTube,
    youtubeVideoId
  }
}
