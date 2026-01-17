'use client'

import Script from 'next/script'

interface AnalyticsProps {
  enabled: boolean
  scriptUrl?: string
  websiteId?: string
}

/**
 * Analytics script component (Umami).
 * Receives configuration from server component as props.
 *
 * Features:
 * - Production-only (controlled by server)
 * - Props-based configuration (no direct env var access)
 * - afterInteractive loading strategy
 *
 * @example
 * ```typescript
 * // In root layout (server component)
 * const analytics = getAnalyticsConfig()
 * <Analytics {...analytics} />
 * ```
 */
export function Analytics({
  enabled,
  scriptUrl,
  websiteId
}: Readonly<AnalyticsProps>) {
  if (!enabled || !scriptUrl || !websiteId) {
    return null
  }

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}
