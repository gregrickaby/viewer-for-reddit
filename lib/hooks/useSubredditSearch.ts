'use client'

import {
  selectSearchQuery,
  setSearchQuery
} from '@/lib/store/features/transientSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {
  useGetPopularSubredditsQuery,
  useSearchSubredditsQuery
} from '@/lib/store/services/redditApi'
import type {SubredditItem} from '@/lib/types'
import {fromSearch} from '@/lib/utils/subredditMapper'
import {useDebouncedValue} from '@mantine/hooks'
import {useMemo} from 'react'

export interface GroupedSearchData {
  communities: SubredditItem[]
  nsfw: SubredditItem[]
  searchHistory: SubredditItem[]
}

export function useSubredditSearch(): {
  query: string
  setQuery: (value: string) => void
  autoCompleteData: SubredditItem[]
  groupedData: GroupedSearchData
} {
  const dispatch = useAppDispatch()
  const query = useAppSelector(selectSearchQuery)
  const [debounced] = useDebouncedValue(query.trim(), 200)
  const nsfw = useAppSelector((state) => state.settings.enableNsfw)
  const searchHistory = useAppSelector((state) => state.settings.searchHistory)

  const {data: searchResults = []} = useSearchSubredditsQuery(
    {query: debounced, enableNsfw: nsfw},
    {skip: debounced.length === 0}
  )

  const {data: popularSubreddits = []} = useGetPopularSubredditsQuery(
    {limit: 10},
    {skip: debounced.length > 0}
  )

  const autoCompleteData = useMemo<SubredditItem[]>(() => {
    if (debounced.length > 0) {
      return searchResults.map(fromSearch)
    }

    return popularSubreddits
  }, [debounced, searchResults, popularSubreddits])

  const groupedData = useMemo<GroupedSearchData>(() => {
    const allResults = autoCompleteData
    const communities = allResults.filter((item) => !item.over18)
    const nsfwResults = allResults.filter((item) => item.over18)

    return {
      communities,
      nsfw: nsfwResults,
      searchHistory: debounced.length === 0 ? searchHistory : []
    }
  }, [autoCompleteData, searchHistory, debounced.length])

  return {
    query,
    setQuery: (value: string) => dispatch(setSearchQuery(value)),
    autoCompleteData,
    groupedData
  }
}
