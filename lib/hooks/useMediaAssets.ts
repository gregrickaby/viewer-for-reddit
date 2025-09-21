'use client'

import type {AutoPostChildData} from '@/lib/store/services/redditApi'
import {getMediumImage} from '@/lib/utils/getMediumImage'
import {useMemo} from 'react'

export function useMediaAssets(post: Readonly<AutoPostChildData>) {
  const mediumImage = useMemo(() => {
    return getMediumImage(post.preview?.images?.[0]?.resolutions ?? []) || null
  }, [post.preview?.images])

  const fallbackUrl = useMemo(() => {
    if (post.url?.includes('gifv')) return post.url.replace('.gifv', '.mp4')
    return (post as any).video_preview?.fallback_url
  }, [post.url, (post as any).video_preview])

  return {
    mediumImage,
    fallbackUrl
  }
}
