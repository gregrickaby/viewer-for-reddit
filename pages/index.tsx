import {createStyles} from '@mantine/core'
import {IconBrandGithub} from '@tabler/icons'
import Head from 'next/head'
import BackToTop from '~/components/BackToTop'
import Results from '~/components/Results'
import Search from '~/components/Search'
import Sort from '~/components/Sort'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  container: {
    margin: '0 auto',
    maxWidth: theme.breakpoints.lg,
    padding: `0 ${theme.spacing.xl}px`,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      padding: theme.spacing.xl
    }
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      flexDirection: 'column',
      textAlign: 'center'
    }
  },
  title: {
    fontSize: theme.fontSizes.xl,
    margin: 0,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      lineHeight: 1
    }
  },
  controls: {
    display: 'flex',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl
  },
  main: {
    minHeight: '100vh'
  },
  footer: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing.md,
    justifyContent: 'center',
    textAlign: 'center',

    a: {
      color: theme.colors.dark[0]
    }
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
          <h1 className={classes.title}>{config.siteTitle}</h1>
          <p>{config.siteDescription}</p>
        </header>
        <main className={classes.main}>
          <div className={classes.controls}>
            <Search />
            <Sort />
          </div>
          <Results />
        </main>
        <footer className={classes.footer}>
          <p>
            website by{' '}
            <a
              href={config.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {config.siteAuthor}
            </a>
          </p>
          <p>
            <a
              href="https://github.com/gregrickaby/reddit-image-viewer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandGithub />
            </a>
          </p>
        </footer>
      </div>
      <BackToTop />
    </>
  )
}
