import BackToTop from '@/components/BackToTop'
import DisplayOptions from '@/components/DisplayOptions'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Meta from '@/components/Meta'
import Search from '@/components/Search'
import config from '@/functions/config'

export default function IndexPage() {
  return (
    <>
      <Meta />
      <div className="container max-w-7xl space-y-12 p-8">
        <Header
          title={config?.siteTitle}
          description={config?.siteDescription}
        />
        <Search />
        <Footer author={config?.siteAuthor} url={config?.authorUrl} />
      </div>
      <DisplayOptions />
      <BackToTop />
    </>
  )
}
