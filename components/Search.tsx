import {Autocomplete, createStyles} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import {useState} from 'react'
import {IconSearch} from '@tabler/icons'
import useSWR from 'swr'
import {fetcher} from '~/lib/helpers'
import {useRedditContext} from './RedditProvider'

const useStyles = createStyles(() => ({
  searchBar: {
    width: '100%'
  }
}))

/**
 * Search component.
 *
 * @see https://mantine.dev/core/autocomplete/
 */
export default function Search() {
  const {setSubreddit} = useRedditContext()
  const {classes} = useStyles()
  const [value, setValue] = useState('')
  const [debounced] = useDebouncedValue(value, 200)
  const {data: results} = useSWR(`/api/search?term=${debounced}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnMount: false
  })

  return (
    <Autocomplete
      aria-label="Search"
      icon={<IconSearch />}
      className={classes.searchBar}
      data={results ? results : []}
      onChange={setValue}
      onItemSubmit={setSubreddit}
      placeholder="Search"
      nothingFound="No subreddits found."
      value={value}
    />
  )
}
