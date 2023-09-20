import BackToTop from '~/components/BackToTop'
import Footer from '~/components/Footer'
import Header from '~/components/Header'
import Meta from '~/components/Meta'
import Results from '~/components/Results'
import Search from '~/components/Search'
import classes from './Page.module.css'

/**
 * Home page component.
 */
export default function HomePage() {
  return (
    <>
      <Meta />
      <div className={classes.container}>
        <Header />
        <main className={classes.main}>
          <div className={classes.search}>
            <Search />
          </div>
          <Results />
        </main>
        <Footer />
      </div>
      <BackToTop />
    </>
  )
}
