import config from '~/lib/config'

/**
 * Meta component.
 */
export default function Meta() {
  return (
    <>
      <link rel="preconnect" href="//preview.redd.it" crossOrigin="anonymous" />

      <meta property="og:title" content={config?.siteTitle} />
      <meta property="og:description" content={config?.metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={config?.siteUrl} />
      <meta
        property="og:image"
        content={`${config?.siteUrl}social-share.jpg`}
      />

      <link rel="canonical" href={config?.siteUrl} />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icon.png" sizes="192x192" />
      <link rel="apple-touch-icon" href="/icon.png" />
      <link rel="manifest" href="/manifest.json" />

      <meta
        name="google-site-verification"
        content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
      />
    </>
  )
}
