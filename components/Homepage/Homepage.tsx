'use client'

import {FavoritePosts} from '@/components/FavoritePosts/FavoritePosts'
import {Posts} from '@/components/Posts/Posts'
import {useAppSelector} from '@/lib/store/hooks'
import {
  selectFavoriteSubreddits,
  selectHasFavorites
} from '@/lib/store/selectors/settingsSelectors'
import {useEffect} from 'react'

/**
 * Homepage component
 *
 * Displays favorite posts if favorites exist, otherwise displays posts from r/all.
 */
export function Homepage() {
  const hasFavorites = useAppSelector(selectHasFavorites)
  const favoriteSubreddits = useAppSelector(selectFavoriteSubreddits)

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

  if (hasFavorites) {
    return <FavoritePosts favorites={favoriteSubreddits} sort="hot" />
  }

  // Default behavior: show r/all when no favorites
  return <Posts subreddit="all" sort="hot" />
}
