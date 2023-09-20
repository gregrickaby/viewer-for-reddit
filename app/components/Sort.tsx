'use client'

import {Group, Select, Text} from '@mantine/core'
import {useRedditContext} from '~/components/RedditProvider'
import classes from '~/components/Sort.module.css'

/**
 * Sort component.
 */
export default function Sort() {
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
