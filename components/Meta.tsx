import Head from 'next/head'
import config from '~/lib/config'

export default function Meta() {
  return (
    <Head>
      <title>{config?.siteTitle}</title>
      <meta name="description" content={config?.siteDescription} />

      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <link rel="preconnect" href="//preview.redd.it" crossOrigin="anonymous" />
      <link rel="preconnect" href="//v.redd.it" crossOrigin="anonymous" />
      <link
        rel="preconnect"
        href="//external-preview.redd.it"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="//i.imgur.com" crossOrigin="anonymous" />
      <link
        as="fetch"
        rel="preload"
        href="/api/reddit?sub=itookapicture&amp;sort=hot&amp;limit=24&amp;after="
        crossOrigin="same-origin"
      />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <link rel="apple-touch-icon" href="/favicon/icon.png" />
      <link rel="icon" href="/favicon/icon.png" sizes="192x192" />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={config?.siteUrl} />
      <meta property="og:title" content={config?.siteTitle} />
      <meta property="og:description" content={config?.siteDescription} />
      <meta
        property="og:image"
        content={`${config?.siteUrl}social-share.jpg`}
      />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={config?.siteUrl} />
      <meta property="twitter:title" content={config?.siteTitle} />
      <meta property="twitter:description" content={config?.siteDescription} />
      <meta
        property="twitter:image"
        content={`${config?.siteUrl}social-share.jpg`}
      />

      <meta
        name="google-site-verification"
        content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
      />
    </Head>
  )
}
