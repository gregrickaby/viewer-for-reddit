'use client'

import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {getMediumImage} from '@/lib/utils/formatting/media/getMediumImage'

export function useMediaAssets(post: Readonly<AutoPostChildData>) {
  const preview = (post as any).preview
  const mediumImage =
    getMediumImage(preview?.images?.[0]?.resolutions ?? []) || null

  const fallbackUrl = post.url?.includes('gifv')
    ? post.url.replace('.gifv', '.mp4')
    : (post as any).video_preview?.fallback_url

  return {
    mediumImage,
    fallbackUrl
  }
}
