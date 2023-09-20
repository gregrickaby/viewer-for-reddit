import BackToTop from '~/components/BackToTop'
import Footer from '~/components/Footer'
import Header from '~/components/Header'

/**
 * Home page component.
 */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <p>Home page</p>
      </main>
      <Footer />
      <BackToTop />
    </>
  )
}
