'use client'

import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import {Autocomplete} from '@mantine/core'
import Link from 'next/link'
import classes from './Search.module.css'

export function Search() {
  const {query, setQuery, autoCompleteData} = useSubredditSearch()

  return (
    <Autocomplete
      aria-label="Search subreddits"
      autoCapitalize="off"
      autoCorrect="off"
      classNames={{root: classes.root}}
      clearable
      data={autoCompleteData}
      onChange={setQuery}
      placeholder="Search subreddits"
      spellCheck="false"
      value={query}
      renderOption={({option}) => (
        <Link href={`/r/${option.value.replace(/^r\//, '')}`}>
          {option.value}
        </Link>
      )}
    />
  )
}
