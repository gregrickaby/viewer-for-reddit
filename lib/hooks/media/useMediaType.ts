'use client'

import type {AutoPostChildData} from '@/lib/store/services/postsApi'

/**
 * useMediaType
 *
 * A small, memoized helper hook that inspects a Reddit post object and derives
 * boolean flags describing what kind of media the post contains. The hook
 * intentionally keeps its API simple so components can make clear rendering
 * decisions (image vs reddit-hosted video vs youtube vs link-with-video, etc.).
 *
 * @param post - The Reddit post object (AutoPostChildData)
 * @returns An object with boolean flags for media types and extracted YouTube ID
 *
 * Example usage
 * ```ts
 * const {isImage, isRedditVideo, isLinkWithVideo, youtubeVideoId} = useMediaType(post)
 * ```
 */
export function useMediaType(post: Readonly<AutoPostChildData>) {
  const postHint = (post as any).post_hint
  const isGallery = (post as any).is_gallery === true
  const isImage = postHint === 'image' && !isGallery
  const isLink = postHint === 'link'
  const isRedditVideo = postHint === 'hosted:video' || postHint === 'rich:video'

  const isYouTube = (post.media_embed as any)?.provider_name === 'YouTube'

  const isLinkWithVideo = isLink
    ? Boolean(
        (post as any).video_preview?.hls_url ||
        (post as any).video_preview?.fallback_url ||
        post.url?.endsWith('.gifv') ||
        post.url?.endsWith('.mp4') ||
        post.url?.endsWith('.webm')
      )
    : false

  const isGifv = Boolean(
    post.url?.endsWith('.gifv') || post.domain === 'i.imgur.com'
  )

  const isVideoFile = Boolean(
    post.url?.endsWith('.mp4') ||
    post.url?.endsWith('.webm') ||
    post.url?.endsWith('.mov') ||
    post.url?.endsWith('.avi')
  )

  const youtubeVideoId = isYouTube
    ? (/embed\/([a-zA-Z0-9_-]+)/.exec(
        (post.media_embed as any)?.html ?? ''
      )?.[1] ?? null)
    : null

  return {
    isGallery,
    isImage,
    isLink,
    isRedditVideo,
    isYouTube,
    isLinkWithVideo,
    isGifv,
    isVideoFile,
    youtubeVideoId
  }
}
