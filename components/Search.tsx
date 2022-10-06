import {Autocomplete, createStyles} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import {IconSearch} from '@tabler/icons'
import useSWR from 'swr'
import {useRedditContext} from '~/components/RedditProvider'
import {fetcher} from '~/lib/helpers'

interface Props {
  setSearchState: React.Dispatch<React.SetStateAction<string>>
  searchState: string
}

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
export default function Search({searchState, setSearchState}: Props) {
  const {setSubreddit} = useRedditContext()
  const {classes} = useStyles()
  const [debounced] = useDebouncedValue(
    `${searchState === '' ? 'itookapicture' : searchState}`,
    300
  )
  const {data: results} = useSWR(`/api/search?term=${debounced}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnMount: false
  })

  const handleChange = (string: string) => {
    setSearchState(string)
  }

  return (
    <Autocomplete
      aria-label="Search sub reddits"
      className={classes.searchBar}
      data={results ? results : []}
      icon={<IconSearch />}
      nothingFound="No subs found. Start typing to search."
      onChange={handleChange}
      onItemSubmit={(value) => setSubreddit(value.value)}
      placeholder="Search for a sub"
      size="lg"
      value={searchState}
    />
  )
}
