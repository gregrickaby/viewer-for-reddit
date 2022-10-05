import {createStyles} from '@mantine/core'
import BackToTop from '~/components/BackToTop'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import Meta from '~/components/Meta'
import Results from '~/components/Results'
import Search from '~/components/Search'
import Settings from '~/components/Settings'
import Sort from '~/components/Sort'

const useStyles = createStyles((theme) => ({
  container: {
    margin: '0 auto',
    maxWidth: theme.breakpoints.lg,
    padding: `0 ${theme.spacing.xl}px`,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      padding: theme.spacing.xl
    }
  },
  search: {
    display: 'flex',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl
  },
  main: {
    minHeight: '100vh'
  }
}))

/**
 * Homepage component.
 */
export default function Homepage() {
  const {classes} = useStyles()
  return (
    <>
      <Meta />
      <div className={classes.container}>
        <Header />
        <main className={classes.main}>
          <div className={classes.search}>
            <Search />
            <Sort />
            <Settings />
          </div>
          <Results />
        </main>
        <Footer />
      </div>
      <BackToTop />
    </>
  )
}
