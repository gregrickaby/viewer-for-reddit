import {
  Badge,
  Group,
  MultiSelect,
  SelectItem,
  SelectItemProps,
  createStyles
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { forwardRef } from 'react'
import useSWR from 'swr'
import { useRedditContext } from '~/components/RedditProvider'
import { fetcher } from '~/lib/helpers'
import Settings from './Settings'

interface ItemProps extends SelectItemProps {
  over_18: boolean
}

const useStyles = createStyles(() => ({
  searchBar: {
    flexBasis: '100%'
  }
}))

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

let storedData:  (string | SelectItem)[] =[{label: 'gif', value: 'gif'}];

function storeValue(values:any){
  storedData =  values.map((value:any) =>{
    return {value: value, label: value};
  })     
}

/**
 * Search component.
 *
 * @see https://mantine.dev/core/autocomplete/
 */
export default function Search() {
  const {setSubreddit, searchInput, setSearchInput, subReddit} =
    useRedditContext()
  const {classes} = useStyles()
  const [debounced] = useDebouncedValue(searchInput, 400)
  const {data: beforeSearch} = useSWR(`/api/preSearch?limit=5`, fetcher)
  const {data: results} = useSWR(`/api/search?term=${debounced}`, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnMount: false
  })

  /**
   * Handle search input change.
   */
  function handleSearch(string: string) {
    setSearchInput(string);
  }
  
  
  /**
   * get item data to populate typeahead
  */
  function formatItems(i:{value: string; label: string}){
    return {value: i.value, label: i.value}
  } 

  function getData(): (string | SelectItem)[] {
    let itemOptions; 
    if (results){
      itemOptions = [...storedData,...results.map(formatItems)];
    } else if (beforeSearch){
      itemOptions = [...storedData,...beforeSearch.map(formatItems)];
    }else {
      itemOptions = ['Empty'];
    }
    return itemOptions;
  }
   
  return (
    <>
      <MultiSelect 
      aria-label="Search sub-reddits"
      className={classes.searchBar}
      clearable
      clearSearchOnBlur
      clearSearchOnChange
      data={getData()}
      hoverOnSearchChange
      nothingFound="No subs found. Try searching for something else."
      onChange={(values) => { 
        storeValue(values); 
        setSubreddit(encodeURI(values.join('%2B')));
        setSearchInput('');
      }}
      onSearchChange={handleSearch}
      placeholder="Pick all that you like"
      searchable
      searchValue = {searchInput}
      />
      <Settings />
    </>
  )
}
