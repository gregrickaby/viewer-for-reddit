import {useState, Suspense} from 'react'
import useSWR from 'swr'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import NoResults from '@/components/NoResults'
import SiteHead from '@/components/SiteHead'

const fetcher = (url) => fetch(url).then((r) => r.json()) // eslint-disable-line no-undef

const Profile = () => {
  const [searchTerm, setSearchTerm] = useState('itookapicture')
  const {data, error} = useSWR(
    `https://www.reddit.com/r/${searchTerm}/.json?limit=200&show=all`,
    fetcher,
    {
      suspense: true
    }
  )

  if (error) return <h1>Error!</h1>

  return (
    <>
      <SiteHead />
      <header className="site-header">
        <div className="wrap">
          <h1 className="site-title">Reddit Image Viewer</h1>
          <div className="site-search">
            <span>r/</span>{' '}
            <input
              className="search-bar"
              type="text"
              placeholder="itookapicture"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>
      <main className="main wrap">
        {!data ? (
          <Spinner />
        ) : typeof data.data == 'undefined' ? (
          <NoResults />
        ) : (
          data.data.children.map((post, index) => (
            <Card key={index} data={post} />
          ))
        )}
      </main>
    </>
  )
}

const Example = () => (
  <Suspense fallback={<Spinner />}>
    <Profile />
  </Suspense>
)

export default Example
