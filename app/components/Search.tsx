'use client'

import {MultiSelect} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import useSWR from 'swr'
import {useRedditContext} from '~/components/RedditProvider'
import classes from '~/components/Search.module.css'
import Settings from '~/components/Settings'
import {fetcher} from '~/lib/helpers'

interface ItemType {
  value: string
  label: string
}

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
   *
   * If there are results, return them, otherwise return the before search data.
   */
  function getData(): Array<ItemType> {
    let items: Array<ItemType> = []

    if (results) {
      items = results
    } else if (beforeSearch) {
      items = beforeSearch
    }

    // Filter out items with empty or null values.
    const filteredItems = items
      .map(formatItems)
      .filter((item: ItemType) => item.value && item.value.trim() !== '')

    return filteredItems.length
      ? filteredItems
      : [{value: 'Empty', label: 'Empty'}]
  }

  return (
    <>
      <MultiSelect
        aria-label="search sub-reddits"
        className={classes.searchbar}
        data={getData()}
        defaultValue={[subReddit]}
        nothingFoundMessage="No subs found. Try searching for something else."
        onChange={(values) => {
          setSubreddit(encodeURIComponent(values.join('+')))
          setSearchInput('')
        }}
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
