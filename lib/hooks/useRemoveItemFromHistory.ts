'use client'

import {clearSingleRecent} from '@/lib/store/features/settingsSlice'
import {useAppDispatch} from '@/lib/store/hooks'
import {showNotification} from '@mantine/notifications'

export function useRemoveItemFromHistory() {
  const dispatch = useAppDispatch()

  const remove = (displayName: string) => {
    if (!displayName) return

    dispatch(clearSingleRecent(displayName))

    showNotification({
      title: 'Deleted',
      message: `r/${displayName} removed from recent history.`,
      color: 'red'
    })
  }

  return {remove}
}
