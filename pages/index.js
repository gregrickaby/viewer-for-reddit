import {useState, useEffect} from 'react'
import {useDebounce} from '@/lib/hooks'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import NoResults from '@/components/NoResults'
import SiteHead from '@/components/SiteHead'
import BackToTop from 'react-easy-back-to-top'
import ThemeToggle from '@/components/ThemeToggle'

const CORS_PROXY = `https://cors-anywhere.herokuapp.com/`

export default function Homepage() {
  const [searchTerm, setSearchTerm] = useState('itookapicture')
  const [results, setResults] = useState()
  const [loading, setLoading] = useState(true)
  const debouncedSearchTerm = useDebounce(searchTerm, 1000)

  useEffect(() => {
    async function fetchData() {
      if (debouncedSearchTerm) {
        // eslint-disable-next-line
        const response = await fetch(
          CORS_PROXY +
            `https://www.reddit.com/r/${searchTerm}/.json?limit=200&show=all`
        )
        const data = await response.json()
        setResults(data)
        setLoading(false)
      } else {
        setResults('itookapicture')
      }
    }
    fetchData()
  }, [debouncedSearchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

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
              placeholder={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <nav className="flex justify-around mt-2">
            <button onClick={() => setSearchTerm('aww')}>r/aww</button>
            <button onClick={() => setSearchTerm('pics')}>r/pics</button>
            <button onClick={() => setSearchTerm('gifs')}>r/gifs</button>
            <button onClick={() => setSearchTerm('earthporn')}>
              r/EarthPorn
            </button>
          </nav>
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
        <ThemeToggle />
        <BackToTop text="&uarr;" padding="4px 10px" />
      </main>
    </>
  )
}
