import {Select} from '@mantine/core'
import {useRedditContext} from '~/components/RedditProvider'

/**
 * Sort component.
 */
export default function Sort() {
  const {sort, setSort} = useRedditContext()

  return (
    <Select
      aria-label="sort posts"
      value={sort}
      data={[
        {value: 'hot', label: 'Hot'},
        {value: 'top', label: 'Top'},
        {value: 'new', label: 'New'},
        {value: 'rising', label: 'Rising'}
      ]}
      onChange={setSort}
      size="lg"
    />
  )
}
