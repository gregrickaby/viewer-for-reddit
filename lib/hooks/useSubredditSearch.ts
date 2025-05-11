import {useAppSelector} from '@/lib/store/hooks'
import {useSearchSubredditsQuery} from '@/lib/store/services/privateApi'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/publicApi'
import {useDebouncedValue} from '@mantine/hooks'
import {useMemo, useState} from 'react'

export function useSubredditSearch() {
  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query.trim(), 200)
  const nsfw = useAppSelector((state) => state.settings.enableNsfw)

  const {data: searchResults = []} = useSearchSubredditsQuery(
    {query: debounced, enableNsfw: nsfw},
    {skip: !debounced}
  )

  const {data: popularResponse} = useGetPopularSubredditsQuery(
    {limit: 25},
    {skip: !!debounced}
  )

  const autoCompleteData = useMemo(() => {
    if (debounced) {
      return searchResults.map((s) => s.display_name_prefixed ?? '')
    }

    return (
      popularResponse?.data?.children.map(
        (child) => child.data.display_name_prefixed ?? ''
      ) ?? []
    )
  }, [debounced, searchResults, popularResponse])

  return {
    query,
    setQuery,
    autoCompleteData
  }
}
