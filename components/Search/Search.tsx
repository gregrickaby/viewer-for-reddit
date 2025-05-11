'use client'

import {useAppSelector} from '@/lib/store/hooks'
import {useSearchSubredditsQuery} from '@/lib/store/services/privateApi'
import {useGetPopularSubredditsQuery} from '@/lib/store/services/publicApi'
import {Autocomplete} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import Link from 'next/link'
import {useMemo, useState} from 'react'
import classes from './Search.module.css'

export function Search() {
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

  return (
    <Autocomplete
      aria-label="Search subreddits"
      classNames={{wrapper: classes.wrapper}}
      clearable
      data={autoCompleteData}
      onChange={setQuery}
      placeholder="Search subreddits"
      value={query}
      renderOption={({option}) => (
        <Link href={`/r/${option.value.replace(/^r\//, '')}`}>
          {option.value}
        </Link>
      )}
    />
  )
}
