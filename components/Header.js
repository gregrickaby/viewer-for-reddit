import React from 'react'
import {useState, useEffect, useRef} from 'react'
import {useDebounce} from '@/lib/hooks'
import {scrollTop, shrinkHeader} from '@/lib/functions'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import NoResults from '@/components/NoResults'
import BackToTop from 'react-easy-back-to-top'
import ThemeToggle from '@/components/ThemeToggle'
const CORS_PROXY = `https://cors-anywhere.herokuapp.com/`
export default function Header() {
  const [searchTerm, setSearchTerm] = useState('itookapicture')
  const [results, setResults] = useState()
  const [loading, setLoading] = useState(true)
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const headerRef = useRef(null)

  useEffect(() => {
    async function fetchData() {
      if (debouncedSearchTerm) {
        // eslint-disable-next-line
        const response = await fetch(
          CORS_PROXY +
            `https://www.reddit.com/r/${searchTerm}/.json?limit=200&show=all`
        )
        const data = await response.json()
        setSearchTerm(searchTerm)
        setResults(data)
        setLoading(false)
        scrollTop()
      } else {
        setResults('itookapicture')
      }
      shrinkHeader(headerRef)
    }
    fetchData()
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
    <div>
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
    </div>
  )
}
