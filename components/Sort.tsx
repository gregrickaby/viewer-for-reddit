'use client'

import {useRedditContext} from '@/components/RedditProvider'
import classes from '@/components/Sort.module.css'
import {Group, Select, Text} from '@mantine/core'

/**
 * Sort component.
 */
export default function Sort() {
  const {sort, setSort} = useRedditContext()

  function sortHandler(value: string | null) {
    if (value !== null) {
      setSort(value)
    }
  }

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
        onChange={sortHandler}
      />
      <Text size="lg">Sort Results</Text>
    </Group>
  )
}
