'use client'

import {SubredditName} from '@/components/SubredditName/SubredditName'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import {Autocomplete, Group} from '@mantine/core'
import Link from 'next/link'
import {useMemo} from 'react'
import classes from './Search.module.css'

export function Search() {
  const {query, setQuery, autoCompleteData} = useSubredditSearch()
  const {showNavbar, toggleNavbarHandler} = useHeaderState()

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
            <Link
              href={`/${item.value}`}
              onClick={showNavbar ? toggleNavbarHandler : undefined}
            >
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
