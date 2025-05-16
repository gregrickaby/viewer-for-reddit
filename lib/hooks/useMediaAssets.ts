import type {PostChildData} from '@/lib/types/posts'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {useMemo} from 'react'

export function useMediaAssets(post: Readonly<PostChildData>) {
  const mediumImage = useMemo(() => {
    return getMediumImage(post.preview?.images?.[0]?.resolutions ?? []) || null
  }, [post.preview?.images])

  const fallbackUrl = useMemo(() => {
    if (post.url?.includes('gifv')) return post.url.replace('.gifv', '.mp4')
    return post.video_preview?.fallback_url
  }, [post.url, post.video_preview])

  return {
    mediumImage,
    fallbackUrl
  }
}
