import Head from 'next/head'
import config from 'site.config'

export default function SiteHead() {
  return (
    <Head>
      <title>{config.siteName}</title>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta name="description" content={config.siteDescription} />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <link rel="preconnect" href="//cors-anywhere.herokuapp.com" />
      <link rel="preconnect" href="//www.reddit.com" />
      <link rel="preconnect" href="//www.googletagmanager.com" />
      <link rel="preconnect" href="//www.google-analytics.com" />
      <link rel="preconnect" href="//i.reddit.com" />
      <link rel="preconnect" href="//i.redd.it.com" />
      <link rel="preconnect" href="//v.redd.it.com" />
      <link rel="preconnect" href="//redditmedia.com" />
      <link rel="preconnect" href="//a.thumbs.redditmedia.com" />
      <link rel="preconnect" href="//b.thumbs.redditmedia.com" />
      <link rel="preconnect" href="//imgur.com" />
      <link rel="preconnect" href="//i.imgur.com" />
      <link
        as="fetch"
        rel="prefetch"
        href="//cors-anywhere.herokuapp.com/https://www.reddit.com/r/itookapicture/.json?limit=5"
        crossOrigin="anonymous"
      />
      <meta name="msapplication-TileColor" content="#1a202c" />
      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <meta name="theme-color" content="#1a202c" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/favicon/apple-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon/favicon-16x16.png"
      />
      <link rel="manifest" href="/favicon/manifest.json" />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:url" content={config.siteUrl} />
      <meta name="twitter:title" content={config.siteName} />
      <meta name="twitter:description" content={config.siteDescription} />
      <meta name="twitter:image" content="/favicon/social-share.jpg" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={config.siteName} />
      <meta property="og:description" content={config.siteDescription} />
      <meta property="og:site_name" content={config.siteName} />
      <meta property="og:url" content={config.siteUrl} />
      <meta property="og:image" content="/favicon/social-share.jpg" />
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-663BF7S0XK"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-663BF7S0XK');`
        }}
      />
    </Head>
  )
}
