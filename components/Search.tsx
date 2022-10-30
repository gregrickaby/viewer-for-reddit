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
  over_18: boolean
}

/**
 * Dropdown item component.
 */
const AutoCompleteItem = forwardRef<HTMLDivElement, ItemProps>(
  ({value, over_18, ...others}: ItemProps, ref) => (
    <div ref={ref} {...others}>
      <Group noWrap position="apart">
        {value}
        {over_18 && <Badge color="red">NSFW</Badge>}
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
  const {data: beforeSearch} = useSWR(`/api/preSearch?limit=5`, fetcher)
  const {data: results} = useSWR(`/api/search?term=${debounced}`, fetcher, {
    revalidateIfStale: true,
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
      data={results ? results : beforeSearch ? beforeSearch : []}
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
