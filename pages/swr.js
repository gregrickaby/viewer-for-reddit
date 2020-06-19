import {useState, useEffect} from 'react'
import {useDebounce} from '@/lib/hooks'
import useSWR from 'swr'
import Card from '@/components/Card'
import NoResults from '@/components/NoResults'
import SiteHead from '@/components/SiteHead'
import Spinner from '@/components/Spinner'

const fetcher = (url) => fetch(url).then((r) => r.json()) // eslint-disable-line no-undef

const Posts = () => {
  const [searchTerm, setSearchTerm] = useState('itookapicture')
  const [results, setResults] = useState()
  const [loading, setLoading] = useState(true)
  const debouncedSearchTerm = useDebounce(searchTerm, 1000)
  const apiUrl = `https://cors-anywhere.herokuapp.com/https://www.reddit.com/r/${searchTerm}/.json?limit=200&show=all`
  const {data, error} = useSWR(loading ? apiUrl : apiUrl, fetcher)

  useEffect(() => {
    async function fetchData() {
      if (debouncedSearchTerm) {
        setResults(data)
        setLoading(false)
      }
    }
    fetchData()
  }, [debouncedSearchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

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
        {loading ? (
          <Spinner />
        ) : typeof results.data == 'undefined' ? (
          <NoResults />
        ) : (
          results.data.children.map((post, index) => (
            <Card key={index} data={post} />
          ))
        )}
      </main>
    </>
  )
}

export default Posts
