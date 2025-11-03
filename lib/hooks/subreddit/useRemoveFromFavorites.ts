'use client'

import {clearSingleFavorite} from '@/lib/store/features/settingsSlice'
import {useAppDispatch} from '@/lib/store/hooks'
import {showNotification} from '@mantine/notifications'

export function useRemoveFromFavorites() {
  const dispatch = useAppDispatch()

  const remove = (displayName: string) => {
    if (!displayName) return

    dispatch(clearSingleFavorite(displayName))

    showNotification({
      title: 'Deleted',
      message: `r/${displayName} removed from favorites.`,
      color: 'red'
    })
  }

  return {remove}
}
