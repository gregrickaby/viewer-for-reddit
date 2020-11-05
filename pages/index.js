import {useState, useEffect, useRef} from 'react'
import ReactModal from 'react-modal'
import {useDebounce} from '@/lib/hooks'
import {fetchData, scrollTop, shrinkHeader} from '@/lib/functions'
import * as config from '@/lib/constants'
import * as searchHistoryStorage from '@/lib/storage/history'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import SpinnerLoadMore from '@/components/SpinnerLoadMore'
import NoResults from '@/components/NoResults'
import SiteHead from '@/components/Meta'
import BackToTop from '@/components/BackToTop'
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
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 700)
  const headerRef = useRef(null)
  const loadingMoreRef = useRef(null)

  /**
   * Reset states to initial value.
   */
  function clearStates() {
    setResults([])
    setLastPost(null)
  }

  /**
   * Save a search term to the session storage
   * and update history state.
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

  /**
   * Render a modal show full of used search terms list.
   *
   * @param {array} searchedList   List of used searched terms
   * @param {boolean} showModal    Check modal showing
   * @param {boolean} onCloseModal Function to close the modal
   */
  function renderHistoryModal(searchedList, showModal, onCloseModal) {
    return (
      <ReactModal
        isOpen={showModal}
        onRequestClose={onCloseModal}
        contentLabel="History Modal"
        className="history modal"
        overlayClassName="overlay"
      >
        <div className="modal-body">
          <div className="modal-title flex justify-between">
            <span className="text-2xl">Search Term History</span>
            <button className="text-4xl" onClick={onCloseModal}>
              ×
            </button>
          </div>
          <div className="modal-content">
            {searchedList.map((history, index) => (
              <button
                className="block"
                key={index}
                onClick={() => {
                  menuClick(history)
                  onCloseModal()
                }}
              >
                r/{history}
              </button>
            ))}
          </div>
        </div>
      </ReactModal>
    )
  }

  /**
   *  Handle search history storage.
   */
  useEffect(() => {
    setSearchHistory(searchHistoryStorage.getAllSavedValue())
  }, [debouncedSearchTerm])

  /**
   * Handle searches and loading posts.
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
      saveHistory(searchTerm)
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
      threshold: 0.1
    }

    // Create IO instance.
    const observer = new IntersectionObserver(
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
  }, [loading])

  /**
   * Handle posts pagination for infinite scroll.
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

  return (
    <>
      <SiteHead />
      <header ref={headerRef} className="site-header">
        <div className="wrap">
          <h1 className="site-title">Reddit Image Viewer</h1>
          <div className="site-search">
            <span>r/</span>{' '}
            <label htmlFor="search" className="sr-only">
              Start typing to display content from a sub reddit
            </label>
            <input
              aria-label="Start typing to display content from a sub reddit"
              className="search-bar"
              onChange={(e) => setSearchTerm(e.target.value)}
              name="search"
              id="search"
              placeholder={searchTerm}
              tabIndex="0"
              type="text"
              value={searchTerm}
            />
            <label htmlFor="sort" className="sr-only">
              Sort the results
            </label>
            <select
              aria-label="Sort the results"
              className="sort-select"
              name="sort"
              id="sort"
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
            <button
              className="modal-displaying-button"
              onClick={() => setShowHistoryModal(true)}
            >
              History
            </button>
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
      {renderHistoryModal(searchHistory, showHistoryModal, () => {
        setShowHistoryModal(false)
      })}
    </>
  )
}
