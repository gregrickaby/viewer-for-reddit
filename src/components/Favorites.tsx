import {
  clearFavorites,
  toggleFavorites,
  toggleSearch
} from '../store/features/settingsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { SubredditItem } from './SubredditItem'

/**
 * Favorites component.
 */
export default function Favorites() {
  // Get the dispatch function from the store.
  const dispatch = useAppDispatch()

  // Get the favorites subreddits from the store.
  const favorites = useAppSelector((state) => state.settings.favorites)

  // Display a message if there are no favorites subreddits.
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 text-center text-zinc-500">
        You don't have any favorites yet.
        <button
          aria-label="Search for subreddits"
          className="mt-8 flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => {
            dispatch(toggleSearch())
          }}
        >
          Search for Subreddits
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {favorites.map((subreddit) => (
        <SubredditItem
          key={subreddit.display_name}
          listType="favorites"
          subreddit={subreddit}
        />
      ))}

      <button
        aria-label="Clear all favorites"
        className="mt-8 flex-1 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        onClick={() => {
          if (confirm('Are you sure? This will clear all your favorites!')) {
            dispatch(clearFavorites())
            dispatch(toggleFavorites())
          }
        }}
      >
        Clear All Favorites
      </button>
    </div>
  )
}
