import classes from '@/app/Page.module.css'
import BackToTop from '@/components/BackToTop'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Results from '@/components/Results'
import Search from '@/components/Search'

/**
 * Homepage component.
 */
export default function HomePage() {
  return (
    <>
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
