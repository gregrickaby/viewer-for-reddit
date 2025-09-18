'use client'

import type {PostChildData} from '@/lib/types/posts'
import {useMemo} from 'react'

/**
 * useMediaType
 *
 * A small, memoized helper hook that inspects a Reddit post object and derives
 * boolean flags describing what kind of media the post contains. The hook
 * intentionally keeps its API simple so components can make clear rendering
 * decisions (image vs reddit-hosted video vs youtube vs link-with-video, etc.).
 *
 * @param post - The Reddit post object (PostChildData)
 * @returns An object with boolean flags for media types and extracted YouTube ID
 *
 * Example usage
 * ```ts
 * const {isImage, isRedditVideo, isLinkWithVideo, youtubeVideoId} = useMediaType(post)
 * ```
 */
export function useMediaType(post: Readonly<PostChildData>) {
  const isImage = post.post_hint === 'image'
  const isLink = post.post_hint === 'link'
  const isRedditVideo =
    post.post_hint === 'hosted:video' || post.post_hint === 'rich:video'

  const isYouTube = post.media?.oembed?.provider_name === 'YouTube'

  const isLinkWithVideo = useMemo(() => {
    if (!isLink) return false

    return Boolean(
      post.video_preview?.hls_url ||
        post.video_preview?.fallback_url ||
        post.url?.endsWith('.gifv') ||
        post.url?.endsWith('.mp4') ||
        post.url?.endsWith('.webm')
    )
  }, [isLink, post.video_preview, post.url])

  const isGifv = useMemo(() => {
    return Boolean(post.url?.endsWith('.gifv') || post.domain === 'i.imgur.com')
  }, [post.url, post.domain])

  const isVideoFile = useMemo(() => {
    return Boolean(
      post.url?.endsWith('.mp4') ||
        post.url?.endsWith('.webm') ||
        post.url?.endsWith('.mov') ||
        post.url?.endsWith('.avi')
    )
  }, [post.url])

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
    isLinkWithVideo,
    isGifv,
    isVideoFile,
    youtubeVideoId
  }
}
