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
      <link rel="dns-prefetch" href="//www.reddit.com" />
      <link rel="dns-prefetch" href="//i.reddit.com" />
      <link rel="dns-prefetch" href="//i.redd.it.com" />
      <link rel="dns-prefetch" href="//v.redd.it.com" />
      <link rel="dns-prefetch" href="//redditmedia.com" />
      <link rel="dns-prefetch" href="//a.thumbs.redditmedia.com" />
      <link rel="dns-prefetch" href="//b.thumbs.redditmedia.com" />
      <link rel="dns-prefetch" href="//imgur.com" />
      <link rel="dns-prefetch" href="//i.imgur.com" />
      <link
        rel="preload"
        href="//cors-anywhere.herokuapp.com/https://www.reddit.com/r/itookapicture/.json?limit=200&show=all"
        as="fetch"
        crossOrigin="anonymous"
      />
    </Head>
  )
}
