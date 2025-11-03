'use client'

import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {getMediumImage} from '@/lib/utils/formatting/getMediumImage'
import {useMemo} from 'react'

export function useMediaAssets(post: Readonly<AutoPostChildData>) {
  const mediumImage = useMemo(() => {
    const preview = (post as any).preview
    return getMediumImage(preview?.images?.[0]?.resolutions ?? []) || null
  }, [(post as any).preview?.images])

  const fallbackUrl = useMemo(() => {
    if (post.url?.includes('gifv')) return post.url.replace('.gifv', '.mp4')
    return (post as any).video_preview?.fallback_url
  }, [post.url, (post as any).video_preview])

  return {
    mediumImage,
    fallbackUrl
  }
}
