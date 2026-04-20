import Script from 'next/script'

interface AnalyticsProps {
  /** Whether analytics is enabled (controlled by server) */
  enabled: boolean
  /** URL of the analytics script */
  scriptUrl?: string
  /** Umami website ID */
  websiteId?: string
}

/** Analytics script component (Umami). Receives configuration from a server component as props. */
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
