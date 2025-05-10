'use client'

import {useSearchSubredditsQuery} from '@/lib/store/services/privateApi'
import {Autocomplete} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import {useState} from 'react'

export function Search() {
  const [query, setQuery] = useState('')
  const [debounced] = useDebouncedValue(query.trim(), 200)

  const {data: subreddits = []} = useSearchSubredditsQuery(
    {query: debounced, enableNsfw: false},
    {skip: !debounced}
  )

  const autoCompleteData = subreddits.map((s) => s.display_name_prefixed ?? '')

  return (
    <Autocomplete
      data={autoCompleteData}
      label="Search subreddits"
      onChange={setQuery}
      placeholder="Search subreddits"
      value={query}
    />
  )
}
