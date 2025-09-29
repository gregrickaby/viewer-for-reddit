import Script from 'next/script'

/**
 * Analytics component that conditionally loads external analytics scripts.
 */
export function Analytics() {
  const shouldLoadAnalytics =
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_ANALYTICS !== 'false'

  if (!shouldLoadAnalytics) {
    return null
  }

  return (
    <Script
      data-website-id={process.env.ANALYTICS_ID}
      src={process.env.ANALYTICS_SCRIPT_URL}
      strategy="afterInteractive"
    />
  )
}
