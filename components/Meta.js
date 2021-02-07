import config from '@/functions/config'
import Head from 'next/head'

export default function Meta() {
  return (
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <title>{config?.siteTitle}</title>
      <meta name="description" content={config?.siteDescription} />
      <link rel="preconnect" href="//www.reddit.com" crossOrigin="anonymous" />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <link rel="apple-touch-icon" href="/favicon/icon.png" />
      <link rel="icon" href="/favicon/icon.png" sizes="192x192" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={config?.siteUrl} />
      <meta
        property="og:title"
        content={`${config?.siteTitle} - ${config?.siteDescription}`}
      />
      <meta property="og:description" content={config?.siteDescription} />
      <meta
        property="og:image"
        content={`${config?.siteUrl}social-share.jpg`}
      />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={config?.siteUrl} />
      <meta
        property="twitter:title"
        content={`${config?.siteTitle} - ${config?.siteDescription}`}
      />
      <meta property="twitter:description" content={config?.siteDescription} />
      <meta
        property="twitter:image"
        content={`${config?.siteUrl}social-share.jpg`}
      />
    </Head>
  )
}
