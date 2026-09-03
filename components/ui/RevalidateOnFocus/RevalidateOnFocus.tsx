'use client'

import {useRevalidateOnFocus} from '@/lib/hooks/useRevalidateOnFocus'

/** Refreshes the current route when the tab regains focus after being hidden long enough to go stale. Renders no visual UI. */
export default function RevalidateOnFocus() {
  useRevalidateOnFocus()

  return null
}
