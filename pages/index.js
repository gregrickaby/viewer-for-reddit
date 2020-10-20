import {useState, useEffect, useRef} from 'react'
import {useDebounce} from '@/lib/hooks'
import {fetchData, scrollTop, shrinkHeader} from '@/lib/functions'
import * as config from '@/lib/constants'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import SpinnerLoadMore from '@/components/SpinnerLoadMore'
import NoResults from '@/components/NoResults'
import SiteHead from '@/components/SiteHead'
import BackToTop from '@/components/BackToTop'
import ThemeToggle from '@/components/ThemeToggle'

export default function Homepage() {
  const [searchTerm, setSearchTerm] = useState(config.DEFAULT_SEARCH_TERM)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [lastPost, setLastPost] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [reachLoadMoreElement, setReachLoadMoreElement] = useState(false)
  const [sortOption, setSortOption] = useState(0)
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const headerRef = useRef(null)
  const loadingMoreRef = useRef(null)

  /**
   * Load posts from Reddit.
   */
  useEffect(() => {
    async function loadPosts() {
      // No search term? Bail...
      if (!debouncedSearchTerm) {
        setResults([])
        return
      }

      setLoading(true)
      const data = await fetchData(searchTerm, lastPost, sortOption)
      setResults(data.posts)
      setLastPost(data.after)
      setLoading(false)
      scrollTop()
    }

    clearStates()
    loadPosts()
    const headerShrinkRemover = shrinkHeader(headerRef)

    // Run cleanup function.
    return () => {
      headerShrinkRemover()
    }
  }, [debouncedSearchTerm, sortOption]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle infinite scroll.
   */
  useEffect(() => {
    async function handleLoadingMore(entities) {
      const target = entities[0]
      if (target.isIntersecting) {
        setReachLoadMoreElement(true)
      }
    }

    // Set Intersection Observer (IO) options.
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.25
    }

    // Create IO instance.
    const observer = new IntersectionObserver( // eslint-disable-line
      handleLoadingMore,
      observerOptions
    )

    // Observe the current item.
    if (loadingMoreRef.current) {
      observer.observe(loadingMoreRef.current)
    }

    // Run clean up function.
    return () => {
      observer.disconnect()
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle posts pagination for Infinite Scroll.
   */
  useEffect(() => {
    setReachLoadMoreElement(false)

    // If we're not loading anything, bail...
    if (results.length === 0 || loading || loadingMore) {
      return
    }

    setLoadingMore(true)

    // Fetch the next batch of posts.
    fetchData(searchTerm, lastPost, sortOption).then((data) => {
      // If there are no more posts, bail.
      if (data.posts.length > 0) {
        setResults((prevResults) => [...prevResults, ...data.posts])
      }
      setLastPost(data.after)
      setLoadingMore(false)
    })
  }, [reachLoadMoreElement]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Helper function to clear states.
   */
  async function clearStates() {
    setResults([])
    setLastPost(null)
  }

  /**
   * Helper function to handle menu clicks.
   *
   * @param {string} searchTerm The search term.
   */
  function menuClick(term) {
    setLastPost(null)
    setSearchTerm(term)
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
        <BackToTop />
      </main>
    </>
  )
}
