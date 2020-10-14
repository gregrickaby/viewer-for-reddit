import {useState, useEffect, useRef} from 'react'
import {useDebounce} from '@/lib/hooks'
import {scrollTop, shrinkHeader} from '@/lib/functions'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import NoResults from '@/components/NoResults'
import SiteHead from '@/components/SiteHead'
import BackToTop from 'react-easy-back-to-top'
import ThemeToggle from '@/components/ThemeToggle'

const CORS_PROXY = `https://cors-anywhere.herokuapp.com/`
const DEFAULT_SEARCH_TERM = 'itookapicture'
const COUNT_ITEMS_PER_FETCH = 5

export default function Homepage() {
  const [searchTerm, setSearchTerm] = useState(DEFAULT_SEARCH_TERM)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  const headerRef = useRef(null)
  const loadingMoreRef = useRef(null)

  async function fetchData(term, after) {
    const url =
      CORS_PROXY +
      `https://www.reddit.com/r/${term}/.json?limit=${COUNT_ITEMS_PER_FETCH}` +
      (after ? `&after=${after}` : '')
    // eslint-disable-next-line
    const response = await fetch(url)
    if (response.ok) {
      const body = await response.json()
      if (body.data && body.data.children) {
        return {
          posts: body.data.children,
          after: body.data.after
        }
      }
    }
    return {posts: [], after: null}
  }

  useEffect(() => {
    async function loadPosts() {
      if (!debouncedSearchTerm) {
        setResults([])
        return
      }
      setLoading(true)
      const data = await fetchData(searchTerm)
      // setSearchTerm(searchTerm)
      setResults(data.posts)
      setLoading(false)
      scrollTop()
      // shrinkHeader(headerRef)
    }
    loadPosts()
  }, [debouncedSearchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Menu item click handler.
   *
   * @param {string} searchTerm The search term.
   */
  function menuClick(searchTerm) {
    setSearchTerm(searchTerm)
    setLoading(true)
    scrollTop()
  }

  return (
    <>
      <SiteHead />
      <header ref={headerRef} className="site-header">
        <div className="wrap">
          <h1 className="site-title">Reddit Image Viewer</h1>
          <div className="site-search">
            <span>r/</span>{' '}
            <input
              className="search-bar"
              type="text"
              placeholder={searchTerm}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="View a sub-reddit"
            />
          </div>
          <nav className="flex justify-around mt-2">
            <button onClick={() => menuClick('aww')}>r/aww</button>
            <button onClick={() => menuClick('pics')}>r/pics</button>
            <button onClick={() => menuClick('gifs')}>r/gifs</button>
            <button onClick={() => menuClick('earthporn')}>r/EarthPorn</button>
          </nav>
        </div>
      </header>

      <main className="main wrap">
        {loading ? (
          <Spinner />
        ) : results.length === 0 ? (
          <NoResults />
        ) : (
          results.map((post, index) => <Card key={index} data={post} />)
        )}
        <div
          ref={loadingMoreRef}
          className="loadingMore"
          style={{display: loadingMore ? 'block' : 'none'}}
        >
          Loading...
        </div>
        <ThemeToggle />
        <BackToTop text="&uarr;" padding="4px 10px" />
      </main>
    </>
  )
}
