'use client'

import {toggleFavoriteSubreddit} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {useLazyGetSubredditAboutQuery} from '@/lib/store/services/subredditApi'
import {logError} from '@/lib/utils/logError'
import {notifications} from '@mantine/notifications'
import {useState} from 'react'

export function useAddFavorite(subreddit: string) {
  const dispatch = useAppDispatch()
  const favorites = useAppSelector((state) => state.settings.favorites)
  const [trigger] = useLazyGetSubredditAboutQuery()
  const [loading, setLoading] = useState(false)
  const isFavorite = favorites.some((sub) => sub.display_name === subreddit)

  const toggle = async () => {
    if (loading) return
    setLoading(true)

    try {
      const data = await trigger(subreddit).unwrap()
      dispatch(toggleFavoriteSubreddit(data))
      notifications.show({
        title: isFavorite ? 'Deleted' : 'Added',
        message: `r/${subreddit} was ${isFavorite ? 'deleted from' : 'added to'} your favorites.`,
        color: isFavorite ? 'blue' : 'green'
      })
    } catch (error) {
      logError(error, {
        component: 'useAddFavorite',
        action: 'addFavorite',
        subreddit,
        context: 'Failed to update favorite subreddit'
      })
      notifications.show({
        title: 'Error',
        message: `Failed to update favorite for r/${subreddit}`,
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return {isFavorite, loading, toggle}
}
