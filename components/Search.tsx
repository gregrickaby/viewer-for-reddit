'use client'

import {fetchSearchResults} from '@/lib/actions'
import config from '@/lib/config'
import {debounce} from '@/lib/functions'
import {RedditSearchResponse} from '@/lib/types'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

/**
 * The search component.
 */
export default function Search() {
  // Setup the router and path.
  const router = useRouter()
  const pathName = usePathname()

  // Setup the initial subreddit and input ref.
  const initialSubreddit = useMemo(
    () => pathName.split('/r/')[1] || '',
    [pathName]
  )
  const inputRef = useRef<HTMLInputElement>(null)

  // Setup component state.
  const [query, setQuery] = useState(initialSubreddit)
  const [sort, setSort] = useState(config.redditApi.sort)
  const [results, setResults] = useState<RedditSearchResponse>({})
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  /**
   * Search input field handler.
   */
  const searchInputHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Get the input value.
      let inputValue = e.target.value.trim()

      // Validate and sanitize the input value.
      inputValue = inputValue?.replace(/\W/g, '')

      // Set component state.
      setQuery(inputValue)
      setSelectedIndex(0)
      setIsDrawerOpen(inputValue !== '')
    },
    []
  )

  /**
   * Sort select field handler.
   */
  const sortSelectHandler = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Get the sort value.
      let sortValue = e.target.value.trim()

      // Validate and sanitize the sort value.
      sortValue = sortValue?.replace(/\W/g, '')

      // Set component state.
      setSort(sortValue)

      // If the sort value hasn't changed or there's no query, return.
      if (sort === sortValue || query.length < 2) return

      // Push the route with the new sort value.
      router.push(`${pathName}?sort=${sortValue}`)
    },
    [query, sort, pathName, router]
  )

  /**
   * Setup the search query with debouncing.
   * Debounces the search query using the reusable debounce function.
   */
  const searchQuery = useCallback(
    debounce(() => {
      // No query? Bail.
      if (query.length < 2) return

      // Fetch and set the search results.
      const fetchAndSetResults = async () => {
        const results = await fetchSearchResults(query)
        setResults(results)
      }

      // Call the fetch and resolve the promise.
      fetchAndSetResults().catch((error) => {
        console.error('Failed to fetch search results:', error)
      })
    }, 500),
    [query]
  )

  // Trigger the debounced search query when the `query` state changes.
  useEffect(() => {
    searchQuery()
  }, [query, searchQuery])

  /**
   * Reset the search.
   */
  const resetSearch = useCallback(() => {
    setQuery('')
    setResults({})
    setIsDrawerOpen(false)
    setSelectedIndex(0)
    setSort(config.redditApi.sort)
  }, [])

  /**
   * Effect for handling keyboard events.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the drawer is not open, return.
      if (!isDrawerOpen) return

      // Setup the item count.
      const itemCount = results?.data?.children?.length ?? 0

      // Handle the down arrow key event.
      if (e.key === 'ArrowDown') {
        // If the selected index is the last item, set the selected index to 0.
        setSelectedIndex((prevIndex) => (prevIndex + 1) % itemCount)
        e.preventDefault()

        // Handle the up arrow key event.
      } else if (e.key === 'ArrowUp') {
        // If the selected index is the first item, set the selected index to the last item.
        setSelectedIndex((prevIndex) => (prevIndex - 1 + itemCount) % itemCount)
        e.preventDefault()

        // Handle the enter key event.
      } else if (e.key === 'Enter' && itemCount > 0) {
        // Get the selected result.
        const selectedResult = results?.data?.children[selectedIndex]

        // If the selected result exists, push the route and reset the search.
        if (selectedResult) {
          router.push(`${selectedResult.data.url}?sort=${sort}`)
          resetSearch()
        }
        e.preventDefault()
      }
    }

    // Add the event listener.
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup the event listener.
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen, results, selectedIndex, router, sort, resetSearch])

  /**
   * Effect for setting the initial focus and query.
   */
  useEffect(() => {
    // If the input ref doesn't exist, return.
    if (!inputRef.current) return

    // Focus the input field.
    inputRef.current.focus()

    // If the path is the root or there's no initial subreddit, reset the search.
    if (pathName === '/' || !initialSubreddit) {
      resetSearch()
    } else {
      setQuery(initialSubreddit)
    }
  }, [pathName, initialSubreddit, resetSearch])

  return (
    <div className="relative flex items-center">
      <input
        aria-label="search for subreddits"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoFocus
        name="search"
        onChange={searchInputHandler}
        placeholder="Search subreddits"
        ref={inputRef}
        type="search"
        value={query}
      />

      <div className="select-container">
        <select
          aria-label="sort posts"
          name="sort"
          onChange={sortSelectHandler}
          value={sort}
        >
          <option value="hot">Hot</option>
          <option value="new">New</option>
          <option value="top">Top</option>
          <option value="rising">Rising</option>
        </select>
      </div>

      {isDrawerOpen && results && (
        <ul className="absolute left-0 top-16 z-50 m-0 w-full list-none rounded-b bg-zinc-200 p-0 dark:bg-zinc-700">
          {results?.data?.children?.map(
            ({data}, index) =>
              data.display_name && (
                <li className="m-0 p-0" key={data.id}>
                  <Link
                    className={`m-0 flex items-center justify-start gap-2 p-1 hover:bg-zinc-300 hover:no-underline dark:hover:bg-zinc-800 ${selectedIndex === index ? 'bg-zinc-300 dark:bg-zinc-800' : ''}`}
                    href={{
                      pathname: data.url,
                      query: {
                        sort
                      }
                    }}
                    onClick={resetSearch}
                    prefetch={false}
                  >
                    <span className="ml-3">{data.display_name}</span>
                    {data.over18 && (
                      <span className="mt-1 font-mono text-xs font-extralight text-red-600">
                        NSFW
                      </span>
                    )}
                  </Link>
                </li>
              )
          )}
        </ul>
      )}
    </div>
  )
}
