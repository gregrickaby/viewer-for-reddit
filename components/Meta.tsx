import Head from 'next/head'
import config from '~/lib/config'

/**
 * Meta component.
 */
export default function Meta() {
  return (
    <Head>
      <title>{config?.siteTitle}</title>
      <meta name="description" content={config?.siteDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <link rel="preconnect" href="//preview.redd.it" crossOrigin="anonymous" />
      <link
        as="fetch"
        rel="preload"
        href={`/api/reddit?sub=${config.redditApi.subReddit}&amp;sort=${config.redditApi.sort}&amp;limit=${config.redditApi.limit}&amp;after=`}
        crossOrigin="anonymous"
      />

      <meta property="og:title" content={config?.siteTitle} />
      <meta property="og:description" content={config?.siteDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={config?.siteUrl} />
      <meta
        property="og:image"
        content={`${config?.siteUrl}social-share.jpg`}
      />

      <link rel="canonical" href={config?.siteUrl} />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icons/icon.png" sizes="192x192" />
      <link rel="apple-touch-icon" href="/icons/icon.png" />
      <link rel="manifest" href="/manifest.json" />

      <meta
        name="google-site-verification"
        content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
      />
    </Head>
  )
}
