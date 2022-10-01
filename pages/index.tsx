import Head from 'next/head'
import BackToTop from '~/components/BackToTop'
import Search from '~/components/Search'
import config from '~/lib/config'

/**
 * Homepage component.
 */
export default function Homepage() {
  return (
    <>
      <Head>
        <title>{config?.siteTitle}</title>
        <meta name="description" content={config?.siteDescription} />
      </Head>
      <div className="container max-w-7xl space-y-12 p-8">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold">{config.siteTitle}</h1>
          <p>{config.siteDescription}</p>
        </header>
        <Search />
        <footer className="py-4 text-center font-mono text-xs">
          <p>
            website by{' '}
            <a href={config.siteUrl} rel="noopener">
              {config.siteAuthor}
            </a>
          </p>
        </footer>
      </div>
      <BackToTop />
    </>
  )
}
