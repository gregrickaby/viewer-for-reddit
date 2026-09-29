'use client'

import { useLinkStatus } from 'next/link'

/**
 * Put inside a `<Link>`. While its navigation is pending it sets `data-pending`,
 * so an ancestor can dim stale content with `:has([data-pending])` (design §8.4).
 */
export function LinkPendingHint() {
  const { pending } = useLinkStatus()
  return <span aria-hidden="true" data-pending={pending ? '' : undefined} />
}
