import {useAppSelector} from '@/lib/store/hooks'
import {
  useGetPopularSubredditsQuery,
  useSearchSubredditsQuery
} from '@/lib/store/services/redditApi'
import type {SubredditItem} from '@/lib/types'
import {fromSearch} from '@/lib/utils/subredditMapper'
import {useDebouncedValue} from '@mantine/hooks'
import {useMemo, useState} from 'react'

export function useSubredditSearch(): {
  query: string
  setQuery: (value: string) => void
  autoCompleteData: SubredditItem[]
} {
  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query.trim(), 200)
  const nsfw = useAppSelector((state) => state.settings.enableNsfw)

  const {data: searchResults = []} = useSearchSubredditsQuery(
    {query: debounced, enableNsfw: nsfw},
    {skip: debounced.length === 0}
  )

  const {data: popularSubreddits = []} = useGetPopularSubredditsQuery(
    {limit: 25},
    {skip: debounced.length > 0}
  )

  const autoCompleteData = useMemo<SubredditItem[]>(() => {
    if (debounced.length > 0) {
      return searchResults.map(fromSearch)
    }

    return popularSubreddits
  }, [debounced, searchResults, popularSubreddits])

  return {
    query,
    setQuery,
    autoCompleteData
  }
}
