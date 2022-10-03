import Head from 'next/head'
import BackToTop from '~/components/BackToTop'
import Results from '~/components/Results'
import Search from '~/components/Search'
import Sort from '~/components/Sort'
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
      <div>
        <header>
          <h1>{config.siteTitle}</h1>
          <p>{config.siteDescription}</p>
          <Search />
          <Sort />
        </header>
        <Results />
        <footer>
          <p>
            website by{' '}
            <a href={config.siteUrl} target="_blank" rel="noopener noreferrer">
              {config.siteAuthor}
            </a>
          </p>
        </footer>
      </div>
      <BackToTop />
    </>
  )
}
