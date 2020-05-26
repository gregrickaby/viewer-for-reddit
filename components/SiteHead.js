import Head from 'next/head'

const SiteHead = () => (
  <Head>
    <title>Reddit Image Viewer</title>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <meta httpEquiv="x-ua-compatible" content="ie=edge" />
    <meta name="description" content="View images from a subreddit." />
  </Head>
)

export default SiteHead
