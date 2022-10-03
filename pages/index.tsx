import {createStyles} from '@mantine/core'
import Head from 'next/head'
import BackToTop from '~/components/BackToTop'
import Results from '~/components/Results'
import Search from '~/components/Search'
import Sort from '~/components/Sort'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  container: {
    margin: '0 auto',
    maxWidth: theme.breakpoints.xl,
    padding: theme.spacing.xl
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignContent: 'center'
  },
  controls: {
    display: 'flex',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl
  },
  main: {
    marginTop: theme.spacing.xl
  }
}))

/**
 * Homepage component.
 */
export default function Homepage() {
  const {classes} = useStyles()
  return (
    <>
      <Head>
        <title>{config?.siteTitle}</title>
        <meta name="description" content={config?.siteDescription} />
      </Head>
      <div className={classes.container}>
        <header className={classes.header}>
          <h1>{config.siteTitle}</h1>
          <p>{config.siteDescription}</p>
        </header>
        <main className={classes.main}>
          <div className={classes.controls}>
            <Search />
            <Sort />
          </div>
          <Results />
        </main>
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
