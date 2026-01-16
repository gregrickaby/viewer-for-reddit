'use client'

import {getAnalyticsConfig} from '@/lib/utils/env'
import Script from 'next/script'

/**
 * Analytics script component (Umami).
 * Only loads in production when analytics is properly configured.
 *
 * Features:
 * - Production-only (disabled in development)
 * - Conditional rendering based on environment variables
 * - afterInteractive loading strategy
 * - Configured via ANALYTICS_SCRIPT_URL and ANALYTICS_ID env vars
 *
 * @example
 * ```typescript
 * // In root layout
 * <body>
 *   <Analytics />
 *   {children}
 * </body>
 * ```
 */
export function Analytics() {
  const analytics = getAnalyticsConfig()

  if (!analytics.enabled) {
    return null
  }

  return (
    <Script
      src={analytics.scriptUrl}
      data-website-id={analytics.websiteId}
      strategy="afterInteractive"
    />
  )
}
