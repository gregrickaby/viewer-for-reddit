'use client'

import {MultiSelect} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import useSWR from 'swr'
import {useRedditContext} from '~/components/RedditProvider'
import classes from '~/components/Search.module.css'
import {fetcher} from '~/lib/helpers'
import Settings from './Settings'

/**
 * Search component.
 *
 * @see https://mantine.dev/core/multi-select/
 */
export default function Search() {
  const {setSubreddit, searchInput, setSearchInput, subReddit} =
    useRedditContext()
  const [debounced] = useDebouncedValue(searchInput, 800)
  const {data: beforeSearch} = useSWR(`/api/preSearch?limit=5`, fetcher)
  const {data: results} = useSWR(`/api/search?term=${debounced}`, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnMount: false
  })

  /**
   * Handle search input change.
   */
  function handleSearch(string: string) {
    setSearchInput(string)
  }

  /**
   * Get item data to populate typeahead and combine with already selected items.
   */
  function formatItems(i: {value: string; label: string}) {
    return {value: i.value, label: i.value}
  }

  /**
   * Get data for typeahead.
   */
  function getData(): Array<string> {
    if (results) {
      return [...results.map(formatItems)]
    } else if (beforeSearch) {
      return [...beforeSearch.map(formatItems)]
    } else {
      return ['Empty']
    }
  }

  return (
    <>
      <MultiSelect
        aria-label="search sub-reddits"
        className={classes.searchBar}
        data={getData()}
        onSearchChange={handleSearch}
        placeholder="Search and select sub-reddits"
        searchable
        searchValue={searchInput}
        size="lg"
      />
      <Settings />
    </>
  )
}
