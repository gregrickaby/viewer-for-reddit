'use client'

import {revalidateFeeds} from '@/lib/actions/reddit/revalidate'
import {STALE_TAB_REVALIDATE_MS} from '@/lib/utils/constants'
import {useDocumentVisibility} from '@mantine/hooks'
import {useRouter} from 'next/navigation'
import {useEffect, useRef} from 'react'

/**
 * Refreshes the current route when the tab regains visibility after being
 * hidden for at least `thresholdMs`, so previously loaded content doesn't
 * go stale for a user who just leaves a tab open.
 *
 * `router.refresh()` alone only clears the client-side route cache, it
 * doesn't touch the server's fetch cache, so a tab left open past
 * `CACHE_POSTS` would keep re-rendering the same stale feed data. Expiring
 * the 'posts' tag first ensures the refresh actually fetches new data.
 *
 * @param thresholdMs - Minimum hidden duration before triggering a refresh (default: {@link STALE_TAB_REVALIDATE_MS})
 */
export function useRevalidateOnFocus(
  thresholdMs: number = STALE_TAB_REVALIDATE_MS
) {
  const router = useRouter()
  const visibility = useDocumentVisibility()
  const hiddenAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (visibility === 'hidden') {
      hiddenAtRef.current = Date.now()
      return
    }

    const hiddenAt = hiddenAtRef.current
    hiddenAtRef.current = null

    if (hiddenAt !== null && Date.now() - hiddenAt >= thresholdMs) {
      revalidateFeeds().then(() => router.refresh())
    }
  }, [visibility, thresholdMs, router])
}
