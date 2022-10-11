import {
  Autocomplete,
  Badge,
  createStyles,
  Group,
  SelectItemProps
} from '@mantine/core'
import {useDebouncedValue} from '@mantine/hooks'
import {IconSearch} from '@tabler/icons'
import {forwardRef} from 'react'
import useSWR from 'swr'
import {useRedditContext} from '~/components/RedditProvider'
import {fetcher} from '~/lib/helpers'

const useStyles = createStyles(() => ({
  searchBar: {
    flex: 1
  }
}))

interface ItemProps extends SelectItemProps {
  over18: string
}

/**
 * Dropdown item component.
 */
const AutoCompleteItem = forwardRef<HTMLDivElement, ItemProps>(
  ({value, over18, ...others}: ItemProps, ref) => (
    <div ref={ref} {...others}>
      <Group noWrap position="apart">
        {value}
        {over18 && <Badge color="red">NSFW</Badge>}
      </Group>
    </div>
  )
)
AutoCompleteItem.displayName = 'AutoCompleteItem'

/**
 * Search component.
 *
 * @see https://mantine.dev/core/autocomplete/
 */
export default function Search() {
  const {setSubreddit, searchInput, setSearchInput} = useRedditContext()
  const {classes} = useStyles()
  const [debounced] = useDebouncedValue(searchInput, 300)
  const {data: results} = useSWR(`/api/search?term=${debounced}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnMount: false
  })

  /**
   * Handle search input change.
   */
  function handleChange(string: string) {
    setSearchInput(string)
  }

  return (
    <Autocomplete
      aria-label="Search sub-reddits"
      className={classes.searchBar}
      data={results ? results : []}
      icon={<IconSearch />}
      itemComponent={AutoCompleteItem}
      nothingFound="No subs found. Start typing to search."
      onChange={handleChange}
      onItemSubmit={(value) => setSubreddit(value.value)}
      placeholder="Search"
      size="lg"
      value={searchInput}
    />
  )
}
