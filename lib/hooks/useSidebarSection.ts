'use client'

import {toggleFavoriteSubreddit} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import type {SubredditItem} from '@/lib/types'
import {showNotification} from '@mantine/notifications'
import {useCallback} from 'react'

export function useSidebarSection(onDelete?: (sub: SubredditItem) => void) {
  const dispatch = useAppDispatch()
  const favorites = useAppSelector((state) => state.settings.favorites)

  const isFavorite = useCallback(
    (sub: SubredditItem): boolean =>
      favorites.some((f) => f.display_name === sub.display_name),
    [favorites]
  )

  const handleDelete = useCallback(
    (sub: SubredditItem): void => {
      if (onDelete) onDelete(sub)
    },
    [onDelete]
  )

  const handleToggleFavorite = useCallback(
    (sub: SubredditItem, alreadyFavorite: boolean): void => {
      dispatch(
        toggleFavoriteSubreddit({
          display_name: sub.display_name,
          icon_img: sub.icon_img ?? '',
          over18: sub.over18 ?? false,
          subscribers: sub.subscribers ?? 0,
          value: sub.value ?? `r/${sub.display_name}`
        })
      )

      showNotification({
        title: alreadyFavorite ? 'Removed' : 'Added',
        message: `r/${sub.display_name} ${alreadyFavorite ? 'removed from' : 'added to'} favorites.`
      })
    },
    [dispatch]
  )

  return {
    isFavorite,
    handleDelete,
    handleToggleFavorite
  }
}
