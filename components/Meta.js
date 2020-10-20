import Head from 'next/head'

export default function SiteHead() {
  return (
    <Head>
      <title>Reddit Image Viewer</title>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <meta
        name="description"
        content="View images and media from any subreddit."
      />
      <link rel="preconnect" href="//cors-anywhere.herokuapp.com" />
      <link
        rel="preload"
        href="//cors-anywhere.herokuapp.com/https://www.reddit.com/r/itookapicture/.json?limit=5"
        as="fetch"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="//www.reddit.com" />
      <link rel="preconnect" href="//www.google-analytics.com" />
      <link rel="preconnect" href="//i.reddit.com" />
      <link rel="preconnect" href="//i.redd.it.com" />
      <link rel="preconnect" href="//v.redd.it.com" />
      <link rel="preconnect" href="//redditmedia.com" />
      <link rel="preconnect" href="//a.thumbs.redditmedia.com" />
      <link rel="preconnect" href="//b.thumbs.redditmedia.com" />
      <link rel="preconnect" href="//imgur.com" />
      <link rel="preconnect" href="//i.imgur.com" />
    </Head>
  )
}
