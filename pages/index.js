import {useState, useEffect, useRef} from 'react'
import {useDebounce} from '@/lib/hooks'
import {fetchData, scrollTop, shrinkHeader} from '@/lib/functions'
import * as config from '@/lib/constants'
import * as searchHistoryStorage from '@/lib/storage/history'
import SiteHead from '@/components/SiteHead'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import SpinnerLoadMore from '@/components/SpinnerLoadMore'
import NoResults from '@/components/NoResults'
import BackToTop from 'react-easy-back-to-top'
import ThemeToggle from '@/components/ThemeToggle'

export default function Homepage() {
  const [searchTerm, setSearchTerm] = useState(config.DEFAULT_SEARCH_TERM)
  const [searchHistory, setSearchHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [lastPost, setLastPost] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [reachLoadMoreElement, setReachLoadMoreElement] = useState(false)
  const [sortOption, setSortOption] = useState(0)
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const headerRef = useRef(null)
  const loadingMoreRef = useRef(null)

  function clearStates() {
    setResults([])
    setLastPost(null)
  }

  /**
   * Save a search term to the session storage
   * and update history state
   *
   * @param {string} searchTerm The search term.
   */
  function saveHistory(term) {
    searchHistoryStorage.storeValue(term)
    setSearchHistory(searchHistoryStorage.getAllSavedValue())
  }

  /**
   * Menu item click handler.
   *
   * @param {string} searchTerm The search term.
   */
  function menuClick(term) {
    setSearchTerm(term)
    scrollTop()
  }

  useEffect(() => {
    setSearchHistory(searchHistoryStorage.getAllSavedValue())
  }, [])

  useEffect(() => {
    async function loadPosts() {
      if (!debouncedSearchTerm) {
        setResults([])
        return
      }
      setLoading(true)
      const data = await fetchData(searchTerm, lastPost, sortOption)
      setResults(data.posts)
      setLastPost(data.after)
      saveHistory(searchTerm)
      setLoading(false)
      scrollTop()
    }
    clearStates()
    loadPosts()
    const headerShrinkRemover = shrinkHeader(headerRef)
    return () => {
      headerShrinkRemover()
    }
  }, [debouncedSearchTerm, sortOption]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function handleLoadingMore(entities) {
      const target = entities[0]
      if (target.isIntersecting) {
        setReachLoadMoreElement(true)
      }
    }
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    }
    // eslint-disable-next-line
    const observer = new IntersectionObserver(
      handleLoadingMore,
      observerOptions
    )
    if (loadingMoreRef.current) {
      observer.observe(loadingMoreRef.current)
    }
    return () => {
      observer.disconnect()
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setReachLoadMoreElement(false)
    if (results.length === 0 || loading || loadingMore) {
      return
    }
    setLoadingMore(true)
    fetchData(searchTerm, lastPost, sortOption).then((data) => {
      if (data.posts.length > 0) {
        setResults((prevResults) => [...prevResults, ...data.posts])
      }
      setLastPost(data.after)
      setLoadingMore(false)
    })
  }, [reachLoadMoreElement]) // eslint-disable-line react-hooks/exhaustive-deps

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
            <select
              className="sort-select"
              onBlur={(e) => setSortOption(e.target.value)}
              onChange={(e) => setSortOption(e.target.value)}
            >
              {config.SORT_OPTIONS.map((sortOption, index) => (
                <option key={index} value={index}>
                  {sortOption}
                </option>
              ))}
            </select>
          </div>
          <nav className="flex justify-around mt-2">
            <button onClick={() => menuClick('aww')}>r/aww</button>
            <button onClick={() => menuClick('pics')}>r/pics</button>
            <button onClick={() => menuClick('gifs')}>r/gifs</button>
            <button onClick={() => menuClick('earthporn')}>r/EarthPorn</button>
          </nav>
          <nav className="flex justify-around mt-2">
            <p>History</p>
            {searchHistory &&
              searchHistory.map((history, index) => (
                <button key={index} onClick={() => menuClick(history)}>
                  r/{history}
                </button>
              ))}
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
        <SpinnerLoadMore elementRef={loadingMoreRef} loading={loadingMore} />
        <ThemeToggle />
        <BackToTop text="&uarr;" padding="4px 10px" />
      </main>
    </>
  )
}
