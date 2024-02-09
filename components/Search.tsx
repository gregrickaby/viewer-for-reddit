'use client'

import {fetchSearchResults} from '@/app/actions'
import {RedditSearchResponse} from '@/lib/types'
import {IconX} from '@tabler/icons-react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useCallback, useEffect, useRef, useState} from 'react'

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
  const router = useRouter()
  const pathname = usePathname()
  const initialSubreddit = pathname.split('/r/')[1]
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(initialSubreddit || '')
  const [results, setResults] = useState<RedditSearchResponse>({})
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const searchInputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputQuery = e.target.value.trim()
    setQuery(inputQuery)
    setSelectedIndex(0)
    setIsDrawerOpen(!!inputQuery)
  }

  const performSearch = useCallback(async () => {
    if (query.length < 2) return
    const results = await fetchSearchResults(query)
    setResults(results)
  }, [query])

  useDebounce(performSearch, 500, [query])

  const resetSearch = () => {
    setQuery('')
    setResults({})
    setIsDrawerOpen(false)
    setSelectedIndex(0)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawerOpen) return
      const itemCount = results?.data?.children?.length || 0

      if (e.key === 'ArrowDown') {
        setSelectedIndex((prevIndex) => (prevIndex + 1) % itemCount)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex((prevIndex) => (prevIndex - 1 + itemCount) % itemCount)
        e.preventDefault()
      } else if (e.key === 'Enter' && itemCount > 0) {
        const selectedResult = results?.data?.children[selectedIndex]
        if (selectedResult) {
          router.push(selectedResult.data.url)
          resetSearch()
        }
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen, results, selectedIndex, router])

  useEffect(() => {
    if (pathname === '/' || !initialSubreddit) {
      setQuery('')
    } else {
      setQuery(initialSubreddit)
    }
  }, [pathname, initialSubreddit])

  return (
    <div className="relative flex items-center pb-8">
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

      {query.length > 0 && (
        <button
          aria-label="clear search"
          className="absolute right-2 z-10 rounded bg-zinc-400 p-1 font-mono text-xs text-zinc-200 transition-all duration-300 ease-in-out hover:bg-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
          onClick={resetSearch}
          type="reset"
        >
          <IconX />
        </button>
      )}

      {isDrawerOpen && results && (
        <ul className="absolute left-0 top-12 z-50 m-0 w-full list-none rounded-b bg-zinc-200 p-0 dark:bg-zinc-700">
          {results?.data?.children?.map(
            ({data}, index) =>
              data.display_name && (
                <li className="m-0 p-0" key={data.id}>
                  <Link
                    className={`m-0 flex items-center justify-start gap-2 p-1 hover:bg-zinc-300 hover:no-underline dark:hover:bg-zinc-800 ${selectedIndex === index ? 'bg-zinc-300 dark:bg-zinc-800' : ''}`}
                    href={data.url || ''}
                    onClick={resetSearch}
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
