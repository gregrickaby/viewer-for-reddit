'use client'

import {fetchSearchResults} from '@/lib/actions'
import {RedditSearchResponse} from '@/lib/types'
import Link from 'next/link'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useCallback, useEffect, useRef, useState} from 'react'
import config from '@/lib/config'

/**
 * Debounce a callback.
 */
function useDebounce(callback: () => void, delay: number, dependencies: any[]) {
  useEffect(() => {
    const handler = setTimeout(() => {
      callback()
    }, delay)

    return () => clearTimeout(handler)
  }, [delay, ...dependencies]) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * The search component.
 */
export default function Search() {
  // Setup the router, path, and search params.
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Setup the initial subreddit, sort, and input ref.
  const initialSubreddit = pathname.split('/r/')[1] || ''
  const initialSort = searchParams.get('sort') || config.redditApi.sort
  const inputRef = useRef<HTMLInputElement>(null)

  // Setup component state.
  const [query, setQuery] = useState(initialSubreddit)
  const [sort, setSort] = useState(initialSort)
  const [results, setResults] = useState<RedditSearchResponse>({})
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Search input field handler.
  const searchInputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the input value.
    let inputValue = e.target.value

    // Trim the input value.
    inputValue = inputValue.trim()

    // Set component state.
    setQuery(inputValue)
    setSelectedIndex(0)
    setIsDrawerOpen(!!inputValue)
  }

  // Sort select field handler.
  const sortSelectHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Set the sort value.
    const sortValue = e.target.value

    // Set component state.
    setSort(sortValue)

    // If there's no query, return.
    if (query.length < 2) return

    // If there is a query, push the route with the sort value.
    router.push(`${pathname}?sort=${e.target.value}`)
  }

  // Setup the search query.
  const searchQuery = useCallback(async () => {
    // If there's no query, return.
    if (query.length < 2) return

    // Fetch the search results.
    const results = await fetchSearchResults(query)

    // Set component state.
    setResults(results)
  }, [query])

  // Debounce the search query.
  useDebounce(searchQuery, 500, [query])

  // Reset all component state.
  const resetSearch = () => {
    setQuery('')
    setResults({})
    setIsDrawerOpen(false)
    setSelectedIndex(0)
    setSort(config.redditApi.sort)
  }

  // Keyboard event handlers.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the drawer is not open, return.
      if (!isDrawerOpen) return

      // Setup the item count.
      const itemCount = results?.data?.children?.length || 0

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
  }, [isDrawerOpen, results, selectedIndex, router, sort])

  // If we're on the homepage, reset the search query.
  useEffect(() => {
    if (pathname === '/' || !initialSubreddit) {
      resetSearch()
    } else {
      setQuery(initialSubreddit)
    }
  }, [pathname, initialSubreddit])

  return (
    <div className="relative flex items-center">
      <input
        aria-label="search"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoFocus
        className="w-full rounded bg-zinc-100 px-4 py-2 outline-none dark:bg-zinc-800 dark:text-zinc-400"
        name="search"
        onChange={searchInputHandler}
        placeholder="Search subreddits"
        ref={inputRef}
        type="search"
        value={query}
      />

      <div className="select-wrapper">
        <select
          className="ml-2 h-16 w-24 appearance-none rounded px-4 py-2 outline-none"
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
