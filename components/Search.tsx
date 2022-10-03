import {Autocomplete, createStyles} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import {IconSearch} from '@tabler/icons'
import {useState} from 'react'
import useSWR from 'swr'
import {useRedditContext} from '~/components/RedditProvider'
import {fetcher} from '~/lib/helpers'

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
      aria-label="Search sub reddits"
      className={classes.searchBar}
      data={results ? results : []}
      icon={<IconSearch />}
      nothingFound="No subs found. Start typing to search."
      onChange={setValue}
      onItemSubmit={(value) => setSubreddit(value.value)}
      placeholder="Search for a sub"
      size="lg"
      value={value}
    />
  )
}
