import {Suspense, useState} from 'react'
import useSWR from 'swr'

import Card from '@/components/Card'
import NoResults from '@/components/NoResults'
import SiteHead from '@/components/SiteHead'
import Spinner from '@/components/Spinner'

const fetcher = (url) => fetch(url).then((r) => r.json()) // eslint-disable-line no-undef

const Posts = () => {
  const [searchTerm, setSearchTerm] = useState('itookapicture')

  const {
    data,
    error
  } = useSWR(
    `https://www.reddit.com/r/${searchTerm}/.json?limit=5&show=all`,
    fetcher,
    {suspense: true}
  )
  if (error) return <NoResults />

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
        {data.data.children.map((post, index) => (
          <Card key={index} data={post} />
        ))}
      </main>
    </>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Posts />
    </Suspense>
  )
}
