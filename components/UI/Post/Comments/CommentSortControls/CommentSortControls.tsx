'use client'

import {setCommentSortingOption} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import type {CommentSortingOption} from '@/lib/types'
import {Group, SegmentedControl, Text} from '@mantine/core'

/**
 * CommentSortControls component
 *
 * Renders a segmented control for users to change comment sorting order.
 * Syncs the selected sort option to Redux state and tracks analytics events.
 *
 * Sorting options:
 * - Best: Reddit's algorithm-based ranking (default)
 * - Top: Highest scored comments
 * - New: Most recently posted comments
 * - Controversial: Most divided sentiment comments
 *
 * @returns JSX.Element segmented control with sort options
 */
export function CommentSortControls() {
  const dispatch = useAppDispatch()
  const currentSort = useAppSelector((state) => state.settings.commentSort)

  /**
   * Handles sort option changes and dispatches Redux action.
   * Updates Redux state and triggers analytics tracking.
   *
   * @param {string} value - The selected sort option value
   */
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
        aria-labelledby="sort-label"
        data={[
          {label: 'Best', value: 'best'},
          {label: 'Top', value: 'top'},
          {label: 'New', value: 'new'},
          {label: 'Controversial', value: 'controversial'}
        ]}
        data-umami-event-sort={currentSort}
        data-umami-event="sort comments"
        onChange={handleSortChange}
        size="xs"
        value={currentSort}
      />
    </Group>
  )
}
