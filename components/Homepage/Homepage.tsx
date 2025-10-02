'use client'

import {FavoritePosts} from '@/components/FavoritePosts/FavoritePosts'
import {Posts} from '@/components/Posts/Posts'
import {useAppSelector} from '@/lib/store/hooks'
import {
  selectFavoriteSubreddits,
  selectHasFavorites
} from '@/lib/store/selectors/settingsSelectors'
import {useEffect, useState} from 'react'

/**
 * Homepage component
 *
 * Priority order:
 * 1. If authenticated: show personalized home feed
 * 2. If has favorites: show favorite posts
 * 3. Default: show r/all
 */
export function Homepage() {
  const hasFavorites = useAppSelector(selectHasFavorites)
  const favoriteSubreddits = useAppSelector(selectFavoriteSubreddits)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [showHomeFeed, setShowHomeFeed] = useState(false)

  // Clean up hash from OAuth redirect
  useEffect(() => {
    if (window.location.hash === '#_') {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      )
    }
  }, [])

  // Check if user wants to see home feed (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      setShowHomeFeed(true)
    } else {
      setShowHomeFeed(false)
    }
  }, [isAuthenticated])

  // 1. Authenticated users: show home feed (Reddit's personalized feed endpoint)
  // Note: For now, fallback to r/all for authenticated users until we implement
  // a proper home feed component that uses the / endpoint instead of /r/
  if (showHomeFeed && isAuthenticated) {
    return <Posts subreddit="all" sort="hot" />
  }

  // 2. Users with favorites: show favorites
  if (hasFavorites) {
    return <FavoritePosts favorites={favoriteSubreddits} sort="hot" />
  }

  // 3. Default: show r/all
  return <Posts subreddit="all" sort="hot" />
}
