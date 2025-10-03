'use client'

import {toggleFavoriteSubreddit} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {
  authenticatedApi,
  useGetUserSubscriptionsQuery
} from '@/lib/store/services/authenticatedApi'
import {useLazyGetSubredditAboutQuery} from '@/lib/store/services/subredditApi'
import {logClientError} from '@/lib/utils/clientLogger'
import {notifications} from '@mantine/notifications'
import {useState} from 'react'

export function useAddFavorite(subreddit: string) {
  const dispatch = useAppDispatch()
  const favorites = useAppSelector((state) => state.settings.favorites)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [trigger] = useLazyGetSubredditAboutQuery()
  const [loading, setLoading] = useState(false)

  // Get user subscriptions if authenticated
  const {data: subscriptions = []} = useGetUserSubscriptionsQuery(undefined, {
    skip: !isAuthenticated
  })

  // For authenticated users, check subscriptions; for read-only, check favorites
  const isFavorite = isAuthenticated
    ? subscriptions.some(
        (sub) => sub.display_name.toLowerCase() === subreddit.toLowerCase()
      )
    : favorites.some((sub) => sub.display_name === subreddit)

  const toggleSubscription = async () => {
    const response = await fetch('/api/reddit/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: isFavorite ? 'unsub' : 'sub',
        sr_name: subreddit
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update subscription')
    }

    dispatch(authenticatedApi.util.invalidateTags(['UserSubscriptions']))

    notifications.show({
      title: isFavorite ? 'Unsubscribed' : 'Subscribed',
      message: `You ${isFavorite ? 'unsubscribed from' : 'subscribed to'} r/${subreddit}`,
      color: isFavorite ? 'blue' : 'green'
    })
  }

  const toggleLocalFavorite = async () => {
    const data = await trigger(subreddit).unwrap()
    dispatch(toggleFavoriteSubreddit(data))

    notifications.show({
      title: isFavorite ? 'Deleted' : 'Added',
      message: `r/${subreddit} was ${isFavorite ? 'deleted from' : 'added to'} your favorites.`,
      color: isFavorite ? 'blue' : 'green'
    })
  }

  const toggle = async () => {
    if (loading) return
    setLoading(true)

    try {
      if (isAuthenticated) {
        await toggleSubscription()
      } else {
        await toggleLocalFavorite()
      }
    } catch (error) {
      logClientError('Failed to update favorite/subscription', {
        component: 'useAddFavorite',
        action: 'toggle',
        subreddit,
        isAuthenticated,
        isFavorite,
        errorMessage: error instanceof Error ? error.message : String(error)
      })

      notifications.show({
        title: 'Error',
        message: `Failed to ${isFavorite ? 'unsubscribe from' : 'subscribe to'} r/${subreddit}`,
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return {isFavorite, loading, toggle}
}
