'use client'

import {STALE_TAB_REVALIDATE_MS} from '@/lib/utils/constants'
import {useDocumentVisibility} from '@mantine/hooks'
import {useRouter} from 'next/navigation'
import {useEffect, useRef} from 'react'

/**
 * Refreshes the current route when the tab regains visibility after being
 * hidden for at least `thresholdMs`, so previously loaded content doesn't
 * go stale for a user who just leaves a tab open.
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
      router.refresh()
    }
  }, [visibility, thresholdMs, router])
}
