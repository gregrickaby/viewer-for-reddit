'use client'

import {setCommentSortingOption} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import type {CommentSortingOption} from '@/lib/types'
import {Group, SegmentedControl, Text} from '@mantine/core'

export function CommentSortControls() {
  const dispatch = useAppDispatch()
  const currentSort = useAppSelector((state) => state.settings.commentSort)

  const handleSortChange = (value: string) => {
    const sortOption = value as CommentSortingOption
    dispatch(setCommentSortingOption(sortOption))
  }

  return (
    <Group gap="sm" align="center" wrap="wrap" mb="md">
      <Text size="sm" fw={500} c="dimmed" id="sort-label">
        Sort by:
      </Text>
      <SegmentedControl
        value={currentSort}
        onChange={handleSortChange}
        data={[
          {label: 'Best', value: 'best'},
          {label: 'Top', value: 'top'},
          {label: 'New', value: 'new'},
          {label: 'Controversial', value: 'controversial'}
        ]}
        size="xs"
        data-umami-event="sort comments"
        data-umami-event-sort={currentSort}
        aria-labelledby="sort-label"
      />
    </Group>
  )
}
