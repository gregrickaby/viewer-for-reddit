'use client'

import {SubredditName} from '@/components/SubredditName/SubredditName'
import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import {Autocomplete, Group} from '@mantine/core'
import Link from 'next/link'
import {useMemo} from 'react'
import classes from './Search.module.css'

export function Search() {
  const {query, setQuery, autoCompleteData} = useSubredditSearch()

  const itemMap = useMemo(
    () => new Map(autoCompleteData.map((item) => [item.value, item])),
    [autoCompleteData]
  )

  return (
    <Autocomplete
      aria-label="Search subreddits"
      autoCapitalize="off"
      autoCorrect="off"
      classNames={{root: classes.root}}
      clearable
      value={query}
      onChange={setQuery}
      data={autoCompleteData.map(({value}) => ({value}))}
      placeholder="Search subreddits"
      spellCheck="false"
      renderOption={({option}) => {
        const item = itemMap.get(option.value)
        if (!item) return null

        return (
          <Group wrap="nowrap">
            <Link href={`/${item.value}`}>
              <SubredditName
                icon={item.icon_img}
                name={item.display_name}
                enableFavorite
              />
            </Link>
          </Group>
        )
      }}
    />
  )
}
