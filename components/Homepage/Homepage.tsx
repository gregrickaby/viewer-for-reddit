'use client'

import {FavoritePosts} from '@/components/FavoritePosts/FavoritePosts'
import {Posts} from '@/components/Posts/Posts'
import {
  selectFavoriteSubreddits,
  selectHasFavorites
} from '@/lib/store/features/settingsSlice'
import {useAppSelector} from '@/lib/store/hooks'

/**
 * Homepage component
 *
 * Displays favorite posts if favorites exist, otherwise displays posts from r/all.
 */
export function Homepage() {
  const hasFavorites = useAppSelector(selectHasFavorites)
  const favoriteSubreddits = useAppSelector(selectFavoriteSubreddits)

  if (hasFavorites) {
    return <FavoritePosts favorites={favoriteSubreddits} sort="hot" />
  }

  // Default behavior: show r/all when no favorites
  return <Posts subreddit="all" sort="hot" />
}
