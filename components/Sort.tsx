import {createStyles, Group, Select, Text} from '@mantine/core'
import {useRedditContext} from '~/components/RedditProvider'

const useStyles = createStyles(() => ({
  select: {
    maxWidth: 110
  }
}))

/**
 * Sort component.
 */
export default function Sort() {
  const {classes} = useStyles()
  const {sort, setSort} = useRedditContext()

  return (
    <Group>
      <Select
        aria-label="sort posts"
        className={classes.select}
        value={sort}
        data={[
          {value: 'hot', label: 'Hot'},
          {value: 'top', label: 'Top'},
          {value: 'new', label: 'New'},
          {value: 'rising', label: 'Rising'}
        ]}
        onChange={setSort}
      />
      <Text size="lg">Sort Results</Text>
    </Group>
  )
}
