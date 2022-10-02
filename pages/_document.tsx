import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript
} from 'next/document'
import config from '~/lib/config'

/**
 * Render a custom Document component.
 */
export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <link
            rel="preconnect"
            href="//preview.redd.it"
            crossOrigin="anonymous"
          />
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
          <meta
            property="twitter:description"
            content={config?.siteDescription}
          />
          <meta
            property="twitter:image"
            content={`${config?.siteUrl}social-share.jpg`}
          />

          <meta
            name="google-site-verification"
            content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
